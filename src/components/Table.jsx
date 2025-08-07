//Importacion de librerias
import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { deleteProduct, updateProduct } from "../services/products.service";

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
  faInbox,
  faChevronRight,
  faChevronLeft,
} from "@fortawesome/free-solid-svg-icons";

// Importacion de componentes
import SearchBar from "./SearchBar";
import ModalProduct from "./ModalProduct"; // Import ModalProducts

export default function Table({ data_list, onDataUpdate }) {
  const [filteredData, setFilteredData] = useState(data_list);
  const [orderby, setOrderby] = useState("");
  const [isAscending, setIsAscending] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10); // Elementos por página
  const [isModalOpen, setIsModalOpen] = useState(false); // State to control modal visibility
  const [selectedProduct, setSelectedProduct] = useState(null); // State to control selected product
  const [editProductId, setEditProductId] = useState(null); // State to control which product is being edited
  const [editProductData, setEditProductData] = useState({}); // State to control the data of the product being edited

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

  const renderIcon = (condition) => {
    return condition ? (
      <FontAwesomeIcon icon={faCheck} style={{ color: "green" }} />
    ) : (
      <FontAwesomeIcon icon={faTimes} style={{ color: "red" }} />
    );
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Products");

    // Generar un archivo Excel
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    // Guardar el archivo
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, "products.xlsx");
  };

  const handleEditChange = (e, key) => {
    const { value } = e.target;
    setEditProductData((prevData) => ({
      ...prevData,
      [key]: value,
    }));
  };

  const saveEdit = async (id) => {
    await updateProduct(id, editProductData);
    setEditProductId(null);
    onDataUpdate(); // Notify parent component to update data
  };

  const deleteData = async (id) => {
    await deleteProduct(id);
    onDataUpdate(); // Notify parent component to update data
  };

  if (filteredData.length === 0) {
    return (
      <div className="bg-slate-200 p-4">
        <SearchBar
          characterSearch={searchQuery}
          setCharacterSearch={setSearchQuery}
        />{" "}
        <div className="flex flex-col items-center justify-center gap-4 p-10 text-center">
          <FontAwesomeIcon icon={faInbox} className="text-6xl text-gray-300" />
          <p className="text-lg text-gray-500">
            No products found. Try adjusting your search or add a new product.
          </p>
          <button
            onClick={() => {
              setSelectedProduct(null);
              setIsModalOpen(true);
            }}
            className="rounded-lg bg-blue-500 px-6 py-2 text-sm text-white transition-all duration-300 hover:bg-blue-700"
          >
            Add New Product
          </button>
        </div>
        {isModalOpen && (
          <ModalProduct
            product={selectedProduct}
            onSave={(product) => {
              updateProduct(product.id, product);
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
      />

      <header className="mb-4 flex flex-wrap items-center justify-between gap-4">
        {/* Título */}
        <h2 className="text-5xl font-bold">Product</h2>

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
            onClick={exportToExcel}
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
        <table className="w-full table-auto text-left text-xl text-gray-700">
          <thead className="border-b-2 bg-white text-xs font-semibold uppercase text-gray-600">
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
              {/* Columna de acciones */}
              <th className="w-24 px-6 py-3 text-center">Actions</th>
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
                        {editProductId === item.id ? (
                          <input
                            type="text"
                            value={editProductData[key] || value}
                            onChange={(e) => handleEditChange(e, key)}
                            className="w-full rounded-md border px-2 py-1"
                          />
                        ) : typeof value === "boolean" ? (
                          renderIcon(value)
                        ) : Array.isArray(value) ? (
                          value.join(", ")
                        ) : (
                          value
                        )}
                      </td>
                    ),
                )}
                <td className="px-6 py-4">
                  <div className="flex gap-4">
                    {editProductId === item.id ? (
                      <button
                        onClick={() => saveEdit(item.id)}
                        className="rounded-md bg-green-100 p-2 text-green-500 hover:bg-green-200"
                      >
                        <FontAwesomeIcon icon={faCheck} />
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => deleteData(item.id)}
                          className="rounded-md bg-red-100 p-2 text-red-500 hover:bg-red-200"
                        >
                          <FontAwesomeIcon icon={faDeleteLeft} />
                        </button>
                        <button
                          onClick={() => {
                            setEditProductId(item.id);
                            setEditProductData(item);
                          }}
                          className="rounded-md bg-yellow-100 p-2 text-yellow-500 hover:bg-yellow-200"
                        >
                          <FontAwesomeIcon icon={faPenToSquare} />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Controles de Paginación */}
      <div className="mt-4 flex items-center justify-between">
        {/* Botón de "Previous" */}
        <button
          onClick={() => paginate(currentPage - 1)}
          disabled={currentPage === 1}
          className={`flex items-center rounded-full px-4 py-2 text-sm font-semibold transition-all duration-300 ${
            currentPage === 1
              ? "cursor-not-allowed bg-blue-200 text-blue-400"
              : "bg-blue-100 text-blue-600 hover:bg-blue-200 hover:text-blue-800"
          }`}
        >
          <FontAwesomeIcon icon={faChevronLeft} className="h-4 w-4" />
          <span className="ml-2">Previous</span>
        </button>

        {/* Páginas numeradas */}
        <div className="flex gap-2">
          {Array.from(
            { length: Math.ceil(filteredData.length / itemsPerPage) },
            (_, index) => index + 1,
          ).map((page) => (
            <button
              key={page}
              onClick={() => paginate(page)}
              className={`flex h-8 w-8 items-center justify-center rounded-full transition-all duration-300 ${
                currentPage === page
                  ? "bg-blue-500 text-white"
                  : "bg-blue-100 text-blue-600 hover:bg-blue-200 hover:text-blue-800"
              }`}
            >
              {page}
            </button>
          ))}
        </div>

        {/* Botón de "Next" */}
        <button
          onClick={() => paginate(currentPage + 1)}
          disabled={
            currentPage === Math.ceil(filteredData.length / itemsPerPage)
          }
          className={`flex items-center rounded-full px-4 py-2 text-sm font-semibold transition-all duration-300 ${
            currentPage === Math.ceil(filteredData.length / itemsPerPage)
              ? "cursor-not-allowed bg-blue-200 text-blue-400"
              : "bg-blue-100 text-blue-600 hover:bg-blue-200 hover:text-blue-800"
          }`}
        >
          <span className="mr-2">Next</span>
          <FontAwesomeIcon icon={faChevronRight} className="h-4 w-4" />
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

Table.propTypes = {
  data_list: PropTypes.array.isRequired,
  onDataUpdate: PropTypes.func.isRequired,
};
