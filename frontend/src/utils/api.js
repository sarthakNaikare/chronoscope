import axios from "axios";

const api = axios.create({ baseURL: "" });

export const fetchEvents       = ()            => api.get("/events").then(r => r.data);
export const fetchCounterfactual = (id)        => api.get(`/events/${id}/counterfactual`).then(r => r.data);
export const fetchChunks       = ()            => api.get("/chunks").then(r => r.data);
export const fetchChunk        = (name)        => api.get(`/chunks/${name}`).then(r => r.data);
export const postExplain       = (text)        => api.post("/explain", { text }).then(r => r.data);
export const postInject        = (device_id)   => api.post("/inject", { device_id, magnitude: 20, duration_minutes: 30 }).then(r => r.data);
export const pollDetector      = ()            => api.post("/events/poll").then(r => r.data);
