import { useEffect, useState } from "react";
import { getCurrentUser } from "../api/client";

function UserStatus() {
    const [user, setUser] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadUser() {
            try {
                const data = await getCurrentUser();
                setUser(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        loadUser();
    }, [])

    if (loading) return <p>Loading user...</p>

    if (error) return <p>Error: {error}</p>

    return (
        <div>
            <h2>Welcome, {user.username}</h2>
            <p>User ID: {user.public_id}</p>
            <p>Database ID: {user.id}</p>
        </div>
    );
}

export default UserStatus;