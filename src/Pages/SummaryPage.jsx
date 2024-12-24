import React from 'react';

const SummaryPage = () => {
    return (
        <div className="summary">
            <h1>Resumen del Supermercado ERP</h1>
            <div className="summary-section">
                <h2>Ventas</h2>
                <p>Total de ventas: $10,000</p>
                <p>Ventas del día: $1,000</p>
            </div>
            <div className="summary-section">
                <h2>Pedidos</h2>
                <p>Pedidos pendientes: 5</p>
                <p>Pedidos completados: 20</p>
            </div>
            <div className="summary-section">
                <h2>Inventario</h2>
                <p>Productos en stock: 150</p>
                <p>Productos agotados: 10</p>
            </div>
            <div className="summary-section">
                <h2>Clientes</h2>
                <p>Total de clientes: 200</p>
                <p>Nuevos clientes: 10</p>
            </div>
        </div>
    );
};

export default SummaryPage;