import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch, faTimes } from "@fortawesome/free-solid-svg-icons";

export default function SearchBar({ characterSearch, setCharacterSearch }) {
  const handleSubmit = (e) => {
    e.preventDefault();
  };

  return (
    <div className="mx-auto my-4 w-full px-4 dark:bg-gray-900">
      <form
        className="relative mx-auto w-full max-w-lg flex items-center"
        onSubmit={handleSubmit}
      >
        {/* Icono de búsqueda */}
        <span className="absolute left-4 text-gray-500 dark:text-gray-400">
          <FontAwesomeIcon icon={faSearch} className="h-5 w-5" />
        </span>

        {/* Campo de entrada */}
        <input
          type="text"
          placeholder="Search for characters..."
          className="w-full rounded-full border border-gray-300 bg-gray-100 py-2 pl-12 pr-4 text-sm text-gray-700 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:ring-gray-500"
          value={characterSearch || ""}
          onChange={(e) => setCharacterSearch(e.target.value)}
        />

        {/* Botón de limpiar */}
        {characterSearch && (
          <button
            type="button"
            className="absolute right-4 text-gray-500 transition-all hover:text-red-500 dark:text-gray-400"
            onClick={() => setCharacterSearch("")}
            aria-label="Clear search"
          >
            <FontAwesomeIcon icon={faTimes} className="h-5 w-5" />
          </button>
        )}
      </form>
    </div>
  );
}
