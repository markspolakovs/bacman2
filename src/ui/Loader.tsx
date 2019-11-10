import React from "react";

export default function Loader() {
  return (
    <div className="loader">
      <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
        <circle
          className="path"
          fill="transparent"
          strokeWidth="4"
          cx="32"
          cy="32"
          r="30"
          stroke="#123456"
        />
      </svg>
    </div>
  );
}
