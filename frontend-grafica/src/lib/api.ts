// src/lib/api.ts
import axios from 'axios';

// Use a variável de ambiente. 
// O '||' define um valor padrão caso a variável não exista.
// const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

export const api = axios.create({
  baseURL: '/api',
});