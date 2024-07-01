import axios from "axios";

export const GetData = async (page, limit) => {
  return await axios.get(`http://localhost:8080/v1/items/?page=${page}&limit=${limit}`);
}

export const CreateData = async (data) => {
  return await axios.post("http://localhost:8080/v1/items", data);
}

export const DeleteData = async (id) => {
  return await axios.delete(`http://localhost:8080/v1/items/${id}`);
}

export const EditData = async (id, newItem) => {
  try {
    const response = await axios.put(`http://localhost:8080/v1/items/${id}`, newItem);
    return response.data;
  } catch (error) {
    console.error("Error updating!", error);
    throw new Error("Error updating!");
  }
};
