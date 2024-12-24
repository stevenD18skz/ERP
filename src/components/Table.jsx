import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPenToSquare,
  faPlus,
  faDeleteLeft,
  faTimes,
  faCheck,
} from "@fortawesome/free-solid-svg-icons";
import SearchBar from "./searchBar";

import { getProducts } from "../services/portProducts";

export default function Table({ deleteData, updateProduct, data_list }) {
  const [filteredData, setFilteredData] = useState(data_list);
  const [orderby, setOrderby] = useState("");
  const [isAscending, setIsAscending] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  console.log(getProducts());

  // Filtrar datos según la barra de búsqueda
  useEffect(() => {
    const filtered = data_list.filter((item) =>
      item?.nombre?.toLowerCase().includes(searchQuery.toLowerCase()),
    );
    setFilteredData(filtered);
  }, [searchQuery, data_list]);

  // Ordenar datos por propiedad
  const handleOrderBy = (prop) => {
    const newOrder = orderby === prop ? !isAscending : true;
    setIsAscending(newOrder);
    setOrderby(prop);

    const sorted = [...filteredData].sort((a, b) => {
      const valueA = a[prop];
      const valueB = b[prop];

      if (typeof valueA === "string" && typeof valueB === "string") {
        return newOrder
          ? valueA.localeCompare(valueB)
          : valueB.localeCompare(valueA);
      }
      if (typeof valueA === "number" && typeof valueB === "number") {
        return newOrder ? valueA - valueB : valueB - valueA;
      }
      if (typeof valueA === "boolean" && typeof valueB === "boolean") {
        return newOrder ? valueA - valueB : valueB - valueA;
      }
      if (!isNaN(Date.parse(valueA)) && !isNaN(Date.parse(valueB))) {
        return newOrder
          ? new Date(valueA) - new Date(valueB)
          : new Date(valueB) - new Date(valueA);
      }
      return 0;
    });

    setFilteredData(sorted);
  };

  const renderButton = () => (
    <button
      onClick={() => console.log("new income")}
      className="w-3/12 rounded-lg bg-green-500 px-4 py-2 text-white shadow-md hover:bg-green-600"
    >
      <FontAwesomeIcon icon={faPlus} className="mr-2" /> Add Item
    </button>
  );

  const renderIcon = (condition) =>
    condition ? (
      <FontAwesomeIcon icon={faCheck} style={{ color: "green" }} />
    ) : (
      <FontAwesomeIcon icon={faTimes} style={{ color: "red" }} />
    );

  if (filteredData.length === 0) {
    return (
      <div className="p-6">
        <div className="relative overflow-x-auto bg-white p-5 shadow-md sm:rounded-lg">
          <header className="flex items-center justify-between">
            <SearchBar
              characterSearch={searchQuery}
              setCharacterSearch={setSearchQuery}
            />
            {renderButton()}
          </header>
          <p className="mt-4 text-center text-gray-700">No hay productos</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-x-auto rounded-lg bg-white p-6 shadow-lg">
      <header className="mb-4 flex items-center justify-between">
        {" "}
        <div className="w-2/3">
          <SearchBar
            characterSearch={searchQuery}
            setCharacterSearch={setSearchQuery}
            className="w-2/3"
          />
        </div>
        {renderButton()}
      </header>

      <table className="w-full table-auto border-collapse text-left text-sm text-gray-600">
        <thead className="bg-gray-100 text-xs font-bold uppercase text-gray-700">
          <tr>
            {Object.keys(filteredData[0])
              .filter((key) => key !== "id")
              .map((key) => (
                <th key={key} className="px-6 py-3">
                  <div className="flex items-center">
                    {key.replace(/_/g, " ")}
                    <button
                      onClick={() => handleOrderBy(key)}
                      aria-label={`Ordenar por ${key}`}
                      className="ml-2"
                    >
                      <svg
                        className={`h-4 w-4 transition-all ${
                          orderby === key ? "text-green-500" : "text-gray-400"
                        }`}
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M8.574 11.024h6.852a2.075 2.075 0 0 0 1.847-1.086 1.9 1.9 0 0 0-.11-1.986L13.736 2.9a2.122 2.122 0 0 0-3.472 0L6.837 7.952a1.9 1.9 0 0 0-.11 1.986 2.074 2.074 0 0 0 1.847 1.086Zm6.852 1.952H8.574a2.072 2.072 0 0 0-1.847 1.087 1.9 1.9 0 0 0 .11 1.985l3.426 5.05a2.123 2.123 0 0 0 3.472 0l3.427-5.05a1.9 1.9 0 0 0 .11-1.985 2.074 2.074 0 0 0-1.846-1.087Z" />
                      </svg>
                    </button>
                  </div>
                </th>
              ))}
            <th className="px-6 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredData.map((item, index) => (
            <tr
              key={index}
              className="border-b transition-all hover:bg-gray-50"
            >
              {Object.entries(item).map(
                ([key, value]) =>
                  key !== "id" && (
                    <td key={key} className="px-6 py-4">
                      {typeof value === "boolean"
                        ? renderIcon(value)
                        : Array.isArray(value)
                          ? value.join(", ")
                          : value}
                    </td>
                  ),
              )}
              <td className="px-6 py-4">
                <div className="flex gap-4">
                  <button
                    onClick={() => deleteData(item.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <FontAwesomeIcon icon={faDeleteLeft} />
                  </button>
                  <button
                    onClick={() => updateProduct(item.id)}
                    className="text-yellow-500 hover:text-yellow-700"
                  >
                    <FontAwesomeIcon icon={faPenToSquare} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
