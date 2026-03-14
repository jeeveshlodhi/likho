"""
S3 presigned URL helpers for release artifact uploads.
Requires boto3 and AWS credentials to be configured.
"""
from __future__ import annotations

import re
from typing import Tuple

from app.core.config import settings


def _sanitize_filename(filename: str) -> str:
    """Keep only safe characters for S3 key."""
    safe = re.sub(r"[^\w.\-]", "_", filename)
    return safe or "release"


def get_presigned_upload_url(filename: str) -> Tuple[str, str]:
    """
    Generate a presigned PUT URL for uploading a release file to S3.
    Returns (upload_url, public_url).
    Public URL assumes the object will be public-read (bucket policy or acl).
    """
    import boto3
    from botocore.exceptions import ClientError

    if not settings.s3_releases_configured:
        raise RuntimeError("S3 releases not configured")

    prefix = (settings.AWS_RELEASES_PREFIX or "releases").strip().rstrip("/")
    safe_name = _sanitize_filename(filename)
    key = f"{prefix}/{safe_name}" if prefix else safe_name

    client = boto3.client(
        "s3",
        region_name=settings.AWS_REGION or "us-east-1",
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
    )
    bucket = settings.AWS_RELEASES_BUCKET
    region = settings.AWS_REGION or "us-east-1"

    upload_url = client.generate_presigned_url(
        "put_object",
        Params={"Bucket": bucket, "Key": key},
        ExpiresIn=3600,
    )

    if region == "us-east-1":
        public_url = f"https://{bucket}.s3.amazonaws.com/{key}"
    else:
        public_url = f"https://{bucket}.s3.{region}.amazonaws.com/{key}"

    return upload_url, public_url
