"""
Health check and monitoring endpoints for the Likho backend.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Dict, Any
from datetime import datetime, timedelta

from app.core.database import get_db

try:
    import psutil
    PSUTIL_AVAILABLE = True
except ImportError:
    PSUTIL_AVAILABLE = False

try:
    from app.modules.remote_config.models import FeatureFlag, RemoteConfig, AppVersion
    from app.modules.feedback.models import Feedback, ErrorLog
    MODELS_AVAILABLE = True
except ImportError:
    MODELS_AVAILABLE = False

router = APIRouter(prefix="/health", tags=["health"])


@router.get("/")
async def health_check(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Basic health check endpoint.
    Returns 200 OK if the service is healthy.
    """
    try:
        # Check database connectivity
        db.execute(text("SELECT 1"))
        
        return {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "version": "1.0.0-beta",
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "status": "unhealthy",
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat(),
            }
        )


@router.get("/ready")
async def readiness_check(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Readiness check for Kubernetes/Docker orchestration.
    Returns 200 OK if the service is ready to accept traffic.
    """
    checks = {
        "database": False,
        "migrations": False,
    }
    
    try:
        # Check database
        db.execute(text("SELECT 1"))
        checks["database"] = True
        
        # Check if required tables exist (basic migration check)
        result = db.execute(text("""
            SELECT COUNT(*) FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('feature_flags', 'remote_configs', 'app_versions')
        """))
        table_count = result.scalar()
        checks["migrations"] = table_count >= 3
        
        all_ready = all(checks.values())
        
        if all_ready:
            return {
                "ready": True,
                "checks": checks,
                "timestamp": datetime.utcnow().isoformat(),
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail={
                    "ready": False,
                    "checks": checks,
                    "timestamp": datetime.utcnow().isoformat(),
                }
            )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "ready": False,
                "checks": checks,
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat(),
            }
        )


@router.get("/live")
async def liveness_check() -> Dict[str, Any]:
    """
    Liveness check for Kubernetes.
    Returns 200 OK if the service is alive (even if not ready).
    """
    return {
        "alive": True,
        "timestamp": datetime.utcnow().isoformat(),
    }


@router.get("/system")
async def system_metrics() -> Dict[str, Any]:
    """
    System metrics for monitoring.
    Requires admin authentication in production.
    """
    if not PSUTIL_AVAILABLE:
        return {
            "timestamp": datetime.utcnow().isoformat(),
            "error": "psutil not installed",
        }
    
    try:
        import os
        
        # Memory usage
        memory = psutil.virtual_memory()
        
        # CPU usage
        cpu_percent = psutil.cpu_percent(interval=1)
        
        # Disk usage
        disk = psutil.disk_usage('/')
        
        # Process info
        process = psutil.Process(os.getpid())
        
        return {
            "timestamp": datetime.utcnow().isoformat(),
            "memory": {
                "total_mb": memory.total / (1024 * 1024),
                "available_mb": memory.available / (1024 * 1024),
                "used_mb": memory.used / (1024 * 1024),
                "percent": memory.percent,
            },
            "cpu": {
                "percent": cpu_percent,
                "count": psutil.cpu_count(),
            },
            "disk": {
                "total_gb": disk.total / (1024 * 1024 * 1024),
                "used_gb": disk.used / (1024 * 1024 * 1024),
                "free_gb": disk.free / (1024 * 1024 * 1024),
                "percent": (disk.used / disk.total) * 100,
            },
            "process": {
                "memory_mb": process.memory_info().rss / (1024 * 1024),
                "cpu_percent": process.cpu_percent(),
                "threads": process.num_threads(),
                "uptime_seconds": (datetime.now() - datetime.fromtimestamp(process.create_time())).total_seconds(),
            },
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get system metrics: {str(e)}"
        )


@router.get("/stats")
async def app_stats(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Application statistics.
    Useful for beta monitoring dashboard.
    """
    if not MODELS_AVAILABLE:
        return {
            "timestamp": datetime.utcnow().isoformat(),
            "error": "Models not available",
        }
    
    try:
        # Feedback stats (last 24 hours)
        day_ago = datetime.utcnow() - timedelta(days=1)
        feedback_24h = db.query(Feedback).filter(Feedback.created_at >= day_ago).count()
        
        # Error stats (last 24 hours)
        errors_24h = db.query(ErrorLog).filter(ErrorLog.created_at >= day_ago).count()
        
        # Total counts
        total_feedback = db.query(Feedback).count()
        total_errors = db.query(ErrorLog).count()
        
        # Feedback by type
        feedback_by_type = {}
        for ftype in ["bug", "feature", "praise", "other"]:
            count = db.query(Feedback).filter(Feedback.type == ftype).count()
            feedback_by_type[ftype] = count
        
        # Pending feedback
        pending_feedback = db.query(Feedback).filter(
            Feedback.status.in_(["new", "in_progress"])
        ).count()
        
        return {
            "timestamp": datetime.utcnow().isoformat(),
            "feedback": {
                "total": total_feedback,
                "last_24h": feedback_24h,
                "pending": pending_feedback,
                "by_type": feedback_by_type,
            },
            "errors": {
                "total": total_errors,
                "last_24h": errors_24h,
            },
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get app stats: {str(e)}"
        )


@router.get("/maintenance")
async def maintenance_status(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Check if the app is in maintenance mode.
    """
    if not MODELS_AVAILABLE:
        return {
            "maintenance_mode": False,
            "timestamp": datetime.utcnow().isoformat(),
        }
    
    try:
        # Check for maintenance_mode feature flag
        flag = db.query(FeatureFlag).filter(
            FeatureFlag.key == "maintenance_mode",
            FeatureFlag.deleted_at.is_(None)
        ).first()
        
        is_maintenance = flag.enabled if flag else False
        
        return {
            "maintenance_mode": is_maintenance,
            "message": flag.description if flag and is_maintenance else None,
            "timestamp": datetime.utcnow().isoformat(),
        }
    except Exception as e:
        # If we can't check, assume not in maintenance
        return {
            "maintenance_mode": False,
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat(),
        }


@router.get("/config-status")
async def config_status(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Get status of remote configuration.
    """
    if not MODELS_AVAILABLE:
        return {
            "timestamp": datetime.utcnow().isoformat(),
            "error": "Models not available",
        }
    
    try:
        # Count feature flags
        feature_flags_count = db.query(FeatureFlag).filter(
            FeatureFlag.deleted_at.is_(None)
        ).count()
        
        enabled_flags = db.query(FeatureFlag).filter(
            FeatureFlag.enabled == True,
            FeatureFlag.deleted_at.is_(None)
        ).count()
        
        # Count remote configs
        config_count = db.query(RemoteConfig).filter(
            RemoteConfig.deleted_at.is_(None)
        ).count()
        
        # Latest version
        latest_version = db.query(AppVersion).order_by(
            AppVersion.created_at.desc()
        ).first()
        
        return {
            "timestamp": datetime.utcnow().isoformat(),
            "feature_flags": {
                "total": feature_flags_count,
                "enabled": enabled_flags,
            },
            "remote_configs": {
                "total": config_count,
            },
            "latest_version": latest_version.version if latest_version else None,
            "min_required_version": latest_version.min_required_version if latest_version else None,
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get config status: {str(e)}"
        )
