import { Link } from "react-router";

const Header = () => {
    return (
        <header className="flex justify-between items-center py-4">
            <div>
                <h1 className="text-2xl font-bold">Likho</h1>
            </div>
            <div className="flex gap-4">
                <Link to="/sign-in" className="btn btn-primary">Sign In</Link>
                <Link to="/sign-up" className="btn btn-primary">Sign Up</Link>
            </div>
        </header>
    );
};

export default Header;