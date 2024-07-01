import React, { useEffect, useState } from "react";
import "./App.css";
import { CreateData, DeleteData, EditData, GetData } from "./api/get";

function App() {
  const [data, setData] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [newItem, setNewItem] = useState({
    title: "",
    desciption: "",
    status: "",
  });

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 5; // Số lượng mục trên mỗi trang

  const fetchData = async (page = 1) => {
    try {
      const response = await GetData(page, itemsPerPage);
      setData(response.data.data);
      const totalItems = response.data.pagination.total;
      setTotalPages(Math.ceil(totalItems / itemsPerPage)); // Tính tổng số trang
    } catch (error) {
      console.error("Failed to fetch data:", error);
    }
  };

  useEffect(() => {
    fetchData(currentPage);
  }, [currentPage]);

  const handleEdit = (id) => {
    setSelectedItemId(id);
    const selectedItem = data.find((item) => item.id === id);
    if (selectedItem) {
      setNewItem({
        title: selectedItem.title,
        desciption: selectedItem.desciption,
        status: selectedItem.status,
      });
      setShowForm(true);
    }
  };

  const handleDelete = async () => {
    try {
      if (selectedItemId) {
        await DeleteData(selectedItemId);
        fetchData(currentPage);
        setShowConfirmModal(false);
      }
    } catch (error) {
      console.error("Failed to delete item:", error);
    }
  };

  const handleAddItem = () => {
    setShowForm(true);
    setNewItem({ title: "", description: "", status: "" });
    setSelectedItemId(null);
  };

  const handleCloseForm = () => {
    setShowForm(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewItem({ ...newItem, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedItemId) {
        await EditData(selectedItemId, newItem);
      } else {
        await CreateData(newItem);
      }

      setNewItem({ title: "", description: "", status: "" });
      setShowForm(false);
      setShowSuccessModal(true);
      fetchData(currentPage);
    } catch (error) {
      console.error("Failed to add/edit item:", error);
      setShowErrorModal(true);
    }
  };

  const closeModal = () => {
    setShowSuccessModal(false);
    setShowErrorModal(false);
    setShowConfirmModal(false);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <div className="table-container">
      <div className="button-container">
        <button className="btn-add" onClick={handleAddItem}>
          Add Item
        </button>
      </div>
      {showForm && (
        <form className="add-item-form" onSubmit={handleSubmit}>
          <h2>{selectedItemId ? "Edit Item" : "Add New Item"}</h2>
          <label>Title:</label>
          <input
            type="text"
            name="title"
            value={newItem.title}
            onChange={handleChange}
            required
          />
          <label>Description:</label>
          <input
            type="text"
            name="desciption"
            value={newItem.desciption}
            onChange={handleChange}
          />
          <label>Status:</label>
          <select
            name="status"
            value={newItem.status}
            onChange={handleChange}
            required
          >
            <option value="">Select Status</option>
            <option value="pending">Doing</option>
            <option value="completed">Done</option>
          </select>
          <div className="form-buttons">
            <button type="submit" className="btn-add">
              {selectedItemId ? "Save Changes" : "Create"}
            </button>
            <button type="button" className="btn-add" onClick={handleCloseForm}>
              Cancel
            </button>
          </div>
        </form>
      )}
      <table className="custom-table">
        <thead>
          <tr>
            <th>STT</th>
            <th>Title</th>
            <th>Description</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr key={index}>
              <td>{(currentPage - 1) * itemsPerPage + index + 1}</td>
              <td>{item.title}</td>
              <td>{item.desciption}</td>
              <td>{item.status}</td>
              <td>
                <button className="btn-edit" onClick={() => handleEdit(item.id)}>
                  Edit
                </button>
                <button
                  className="btn-delete"
                  onClick={() => {
                    setSelectedItemId(item.id);
                    setShowConfirmModal(true);
                  }}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      <div className="pagination">
        {Array.from({ length: totalPages }, (_, i) => (
          <button
            key={i + 1}
            className={`pagination-button ${i + 1 === currentPage ? "active" : ""}`}
            onClick={() => handlePageChange(i + 1)}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="modal">
          <div className="modal-content">
            <span className="close" onClick={closeModal}>
              &times;
            </span>
            <h2>Success</h2>
            <p>Item {selectedItemId ? "updated" : "added"} successfully!</p>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {showErrorModal && (
        <div className="modal">
          <div className="modal-content">
            <span className="close" onClick={closeModal}>
              &times;
            </span>
            <h2>Error</h2>
            <p>Failed to {selectedItemId ? "update" : "add"} item!</p>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      {showConfirmModal && (
        <div className="modal">
          <div className="modal-content">
            <span className="close" onClick={() => setShowConfirmModal(false)}>
              &times;
            </span>
            <h2>Delete Item</h2>
            <p>Are you sure you want to delete this item?</p>
            <div className="modal-buttons">
              <button className="modal-button primary" onClick={handleDelete}>
                Yes
              </button>
              <button
                className="modal-button secondary"
                onClick={() => setShowConfirmModal(false)}
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
