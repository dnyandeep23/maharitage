import React from "react";

const Profile = ({ user }) => {
  return (
    <div className="text-green-950">
      <h2 className="text-2xl font-bold mb-4">User Profile</h2>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <p className="text-lg mb-2">
          <span className="font-semibold">Username:</span> {user?.username}
        </p>
        <p className="text-lg mb-2">
          <span className="font-semibold">Email:</span> {user?.email}
        </p>
        <p className="text-lg mb-2">
          <span className="font-semibold">Role:</span> {user?.role}
        </p>
      </div>
    </div>
  );
};

export default Profile;
