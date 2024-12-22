import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPenToSquare,
  faPlus,
  faDeleteLeft,
} from "@fortawesome/free-solid-svg-icons";
import SearchBar from "./searchBar";

export default function Table({ deleteData, updateProduct, data_list }) {
  const [income, setIncome] = useState(data_list);
  const [orderby, setOrderby] = useState("");
  const [order, setOrder] = useState(true); // true: ascendentemente, false: descendentemente
  const [characterSearch, setCharacterSearch] = useState("");

  useEffect(() => {
    try {
      // Filtrar la lista de datos según el texto en la barra de búsqueda
      const personajesFiltrados = data_list.filter((poke) =>
        poke?.title.toLowerCase().includes(characterSearch.toLowerCase())
      );
      setIncome(personajesFiltrados);
    } catch (e) {
      console.error(e);
    }
  }, [characterSearch, data_list]);

  // Actualizar el estado interno cuando data_list cambie
  useEffect(() => {
    setIncome(data_list);
  }, [data_list]);

  const orderProp = (prop) => {
    // Cambiar el orden si la propiedad es la misma
    setOrder(prop === orderby ? !order : true);

    const sortedData = [...income].sort((a, b) => {
      let attrA = a[prop];
      let attrB = b[prop];

      // Verificar el tipo de datos y ordenar en consecuencia
      if (typeof attrA === "string" && typeof attrB === "string") {
        return order ? attrA.localeCompare(attrB) : attrB.localeCompare(attrA);
      } else if (typeof attrA === "number" && typeof attrB === "number") {
        return order ? attrA - attrB : attrB - attrA;
      } else if (
        new Date(attrA) instanceof Date &&
        !isNaN(new Date(attrA)) &&
        new Date(attrB) instanceof Date &&
        !isNaN(new Date(attrB))
      ) {
        return order
          ? new Date(attrA) - new Date(attrB)
          : new Date(attrB) - new Date(attrA);
      } else {
        return 0;
      }
    });

    setIncome(sortedData);
    setOrderby(prop);
  };

  return (
    <div className="relative overflow-x-auto bg-slate-800 p-5 shadow-md sm:rounded-lg">
      <header className="flex justify-evenly">
        <SearchBar
          characterSearch={characterSearch}
          setCharacterSearch={setCharacterSearch}
        />

        <button
          onClick={() => console.log("ola")}
          className="w-8/12 rounded-xl border border-cyan-800 py-3 transition-all duration-300 ease-in-out hover:border-dashed hover:bg-cyan-600 hover:text-white"
        >
          new income
        </button>
      </header>

      <table className="w-full text-left text-sm text-gray-500 rtl:text-right dark:text-gray-400">
        <thead className="bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-700 dark:text-gray-400">
          <tr>
            {income.length > 0 &&
              Object.keys(income[0]).map((key) => {
                if (key !== "id") {
                  return (
                    <th key={key} scope="col" className="px-6 py-3 text-3xl">
                      <div className="flex items-center">
                        {key}
                        <button onClick={() => orderProp(key)}>
                          <svg
                            className={`ms-1.5 h-3 w-3 transition-all duration-300 ease-in-out ${
                              orderby === key ? "text-orange-600" : ""
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
                  );
                }
                return null;
              })}
            <th scope="col" className="px-6 py-3">
              <span className="sr-only">Edit</span>
            </th>
          </tr>
        </thead>

        <tbody>
          {income.length > 0 ? (
            income.map((current) => (
              <tr
                key={current.id}
                className="border-b bg-white text-2xl transition-all duration-1000 ease-in-out hover:bg-slate-200 dark:border-gray-700 dark:bg-gray-800"
              >
                <th
                  scope="row"
                  className="whitespace-nowrap px-6 py-4 font-medium text-gray-900 dark:text-white"
                >
                  {current.title}
                </th>
                {Object.keys(current)
                  .slice(2)
                  .map((valor, index) => {
                    const cellValue = current[valor];

                    return (
                      <td key={index} className="px-6 py-4">
                        {Array.isArray(cellValue)
                          ? cellValue.join(", ")
                          : cellValue}
                      </td>
                    );
                  })}
                <td className="flex w-full justify-between py-4">
                  <button
                    onClick={() =>
                      deleteData("http://localhost:3000/wishlist", current.id)
                    }
                    className="font-medium text-blue-600 hover:underline dark:text-blue-500"
                  >
                    <FontAwesomeIcon
                      icon={faDeleteLeft}
                      style={{ color: "#cf1717" }}
                    />
                  </button>
                  <button
                    onClick={() =>
                      updateProduct(
                        "http://localhost:3000/wishlist",
                        current.id
                      )
                    }
                    className="font-medium text-blue-600 hover:underline dark:text-blue-500"
                  >
                    <FontAwesomeIcon
                      icon={faPenToSquare}
                      style={{ color: "#e6bd28" }}
                    />
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={Object.keys(data_list[0]).length}
                className="px-6 py-4 text-center"
              >
                No se encontraron personajes.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
