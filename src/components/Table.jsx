import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPenToSquare,
  faPlus,
  faDeleteLeft,
  faTimes,
  faCheck,
  faSortUp,
  faSortDown,
  faFileExport,
  faFilter,
} from "@fortawesome/free-solid-svg-icons";
import SearchBar from "./searchBar";
import ModalProduct from "./ModalProduct"; // Import ModalProduct

import {
  getProducts,
  deleteProduct,
  updateProduct,
} from "../services/portProducts";

export default function Table({ data_list }) {
  const [filteredData, setFilteredData] = useState(data_list);
  const [orderby, setOrderby] = useState("");
  const [isAscending, setIsAscending] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5); // Elementos por página
  const [isModalOpen, setIsModalOpen] = useState(false); // State to control modal visibility
  const [selectedProduct, setSelectedProduct] = useState(null); // State to control selected product

  // Filtrar datos según la barra de búsqueda
  useEffect(() => {
    const filtered = data_list.filter((item) =>
      item?.name?.toLowerCase().includes(searchQuery.toLowerCase()),
    );
    setFilteredData(filtered);
    setCurrentPage(1); // Resetear a la primera página cuando cambia el filtro
  }, [searchQuery, data_list, isModalOpen]);

  // Calcular datos visibles para la página actual
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);

  // Cambiar de página
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

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
      onClick={() => {
        setSelectedProduct(null);
        setIsModalOpen(true);
      }}
      className="rounded-xl bg-green-500 px-4 py-2 text-white hover:bg-green-600"
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
        {isModalOpen && (
          <ModalProduct
            product={selectedProduct}
            onSave={(product) => {
              updateProduct(product);
              setIsModalOpen(false);
            }}
            onClose={() => setIsModalOpen(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="bg-slate-200 p-4">
      <SearchBar
        characterSearch={searchQuery}
        setCharacterSearch={setSearchQuery}
        className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-600 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
      />

      <header className="mb-4 flex flex-wrap items-center justify-between gap-4">
        {/* Título */}
        <h2 className="text-3xl font-bold">Product</h2>

        {/* Contenedor de acciones */}
        <div className="flex w-full flex-wrap justify-end gap-4 sm:w-auto sm:gap-2">
          {/* Selector de número de elementos */}
          <div className="flex items-center gap-2">
            <p className="text-sm text-gray-700">Showing</p>
            <select
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              className="rounded-md border px-2 py-1 text-sm text-gray-600 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              {[5, 10, 15, 20, 25].map((number) => (
                <option key={number} value={number}>
                  {number}
                </option>
              ))}
            </select>
          </div>

          {/* Botón de filtro */}
          <button
            className="flex items-center gap-2 rounded-lg bg-slate-50 px-4 py-2 text-sm text-gray-600 transition-all duration-300 hover:bg-slate-400 hover:text-white"
            aria-label="Filter products"
          >
            <FontAwesomeIcon icon={faFilter} />
            <span>Filter</span>
          </button>

          {/* Botón de exportar */}
          <button
            className="flex items-center gap-2 rounded-lg bg-slate-50 px-4 py-2 text-sm text-gray-600 transition-all duration-300 hover:bg-slate-400 hover:text-white"
            aria-label="Export products"
          >
            <FontAwesomeIcon icon={faFileExport} />
            <span>Export</span>
          </button>

          {/* Botón de agregar producto */}
          <button
            className="flex items-center justify-center gap-2 rounded-lg bg-blue-500 px-6 py-2 text-sm text-white transition-all duration-300 hover:bg-blue-700"
            onClick={() => {
              setSelectedProduct(null);
              setIsModalOpen(true);
            }}
            aria-label="Add new product"
          >
            <FontAwesomeIcon icon={faPlus} />
            <span>Add New Product</span>
          </button>
        </div>
      </header>

      <div className="overflow-hidden rounded-3xl border">
        <table className="w-full table-auto text-left text-sm text-gray-700">
          <thead className="border-b-2 bg-white text-xs font-semibold uppercase text-gray-600">
            <tr className="">
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
                        {orderby === key && isAscending ? (
                          <FontAwesomeIcon
                            icon={faSortUp}
                            className={`h-4 w-4 transition-all ${
                              orderby === key
                                ? "text-green-500"
                                : "text-gray-400"
                            }`}
                          />
                        ) : (
                          <FontAwesomeIcon
                            icon={faSortDown}
                            className={`h-4 w-4 transition-all ${
                              orderby === key
                                ? "text-blue-300"
                                : "text-gray-400"
                            }`}
                          />
                        )}
                      </button>
                    </div>
                  </th>
                ))}
              <th className="px-6 py-3">Actions</th>
            </tr>
          </thead>

          <tbody>
            {currentItems.map((item, index) => (
              <tr
                key={index}
                className="border-b-2 bg-white transition-all hover:bg-slate-100"
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
                      className="rounded-md bg-red-100 p-2 text-red-500 hover:bg-red-200"
                    >
                      <FontAwesomeIcon icon={faDeleteLeft} />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedProduct(item);
                        setIsModalOpen(true);
                      }}
                      className="rounded-md bg-yellow-100 p-2 text-yellow-500 hover:bg-yellow-200"
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

      {/* Controles de Paginación */}
      <div className="mt-4 flex items-center justify-between">
        <button
          onClick={() => paginate(currentPage - 1)}
          disabled={currentPage === 1}
          className={`rounded-md px-4 py-2 text-sm font-semibold ${
            currentPage === 1
              ? "bg-gray-200 text-gray-400"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Previous
        </button>
        <div className="flex gap-2">
          {Array.from(
            { length: Math.ceil(filteredData.length / itemsPerPage) },
            (_, index) => index + 1,
          ).map((page) => (
            <button
              key={page}
              onClick={() => paginate(page)}
              className={`h-8 w-8 rounded-full ${
                currentPage === page
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {page}
            </button>
          ))}
        </div>
        <button
          onClick={() => paginate(currentPage + 1)}
          disabled={
            currentPage === Math.ceil(filteredData.length / itemsPerPage)
          }
          className={`rounded-md px-4 py-2 text-sm font-semibold ${
            currentPage === Math.ceil(filteredData.length / itemsPerPage)
              ? "bg-gray-200 text-gray-400"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Next
        </button>
      </div>

      {isModalOpen && (
        <ModalProduct
          product={selectedProduct}
          onSave={(product) => {
            console.log(product.id, product);
            updateProduct(product.id, product);
            setIsModalOpen(false);
          }}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}
