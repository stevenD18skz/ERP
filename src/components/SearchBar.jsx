import React from "react";

export default function SearchBar({ characterSearch, setCharacterSearch }) {
  const handleSubmit = (e) => {
    e.preventDefault();
  };

  document.documentElement.classList.toggle("ligth", true);

  return (
    <div className="mx-auto my-4 w-full bg-gray-100 dark:bg-gray-900">
      <div
        id="search-bar"
        className="w-120 z-10 rounded-md bg-white shadow-xl dark:bg-gray-800"
      >
        <form
          className="flex items-center justify-center p-2"
          onSubmit={handleSubmit}
        >
          <input
            type="text"
            placeholder="Search here"
            className="w-full rounded-md bg-gray-200 px-2 py-1 text-black focus:outline-none focus:ring-2 focus:ring-gray-300 dark:bg-gray-700 dark:text-white dark:focus:ring-gray-500"
            value={characterSearch || ""}
            onChange={(e) => setCharacterSearch(e.target.value)}
          />
        </form>
      </div>
    </div>
  );
}
