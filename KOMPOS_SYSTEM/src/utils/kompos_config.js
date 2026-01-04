{
  "project_name": "Smart Compost Monitoring - Simplified",
  "version": "2.0",
  "total_rules": 16,
  "variables": {
    "inputs": {
      "suhu": ["Dingin", "Ideal", "Panas"],
      "ph": ["Asam", "Netral", "Basa"],
      "kelembapan": ["Kering", "Sedang", "Basah"],
      "bau": ["Tidak Bau", "Cukup Bau", "Bau Busuk"]
    },
    "outputs": {
      "status_kompos": ["Buruk", "Sedang", "Baik", "Sangat Baik"]
    }
  },
  "rules": [
    { "id": 1, "if": { "bau": "Tidak Bau", "suhu": "Ideal", "ph": "Netral", "kelembapan": "Sedang" }, "then": "Sangat Baik" },

    { "id": 2, "if": { "bau": "Tidak Bau", "suhu": "Ideal", "ph": "Netral", "kelembapan": "Basah" }, "then": "Baik" },
    { "id": 3, "if": { "bau": "Tidak Bau", "suhu": "Ideal", "ph": "Netral", "kelembapan": "Kering" }, "then": "Baik" },
    { "id": 4, "if": { "bau": "Tidak Bau", "suhu": "Ideal", "ph": "Asam", "kelembapan": "Sedang" }, "then": "Baik" },
    { "id": 5, "if": { "bau": "Tidak Bau", "suhu": "Ideal", "ph": "Basa", "kelembapan": "Sedang" }, "then": "Baik" },
    { "id": 6, "if": { "bau": "Tidak Bau", "suhu": "Panas", "ph": "Netral", "kelembapan": "Sedang" }, "then": "Baik" },

    { "id": 7, "if": { "bau": "Tidak Bau", "suhu": "Dingin", "ph": "Netral", "kelembapan": "Sedang" }, "then": "Sedang" },
    { "id": 8, "if": { "bau": "Tidak Bau", "suhu": "Panas", "ph": "Asam", "kelembapan": "Basah" }, "then": "Sedang" },
    { "id": 9, "if": { "bau": "Cukup Bau", "suhu": "Ideal", "ph": "Netral", "kelembapan": "Sedang" }, "then": "Sedang" },
    { "id": 10, "if": { "bau": "Cukup Bau", "suhu": "Ideal", "ph": "Asam", "kelembapan": "Sedang" }, "then": "Sedang" },

    { "id": 11, "if": { "bau": "Tidak Bau", "suhu": "Dingin", "ph": "Asam", "kelembapan": "Basah" }, "then": "Buruk" },
    { "id": 12, "if": { "bau": "Tidak Bau", "suhu": "Panas", "ph": "Basa", "kelembapan": "Kering" }, "then": "Buruk" },
    { "id": 13, "if": { "bau": "Cukup Bau", "suhu": "Dingin", "ph": "Asam", "kelembapan": "Basah" }, "then": "Buruk" },
    
    { "id": 14, "if": { "bau": "Bau Busuk", "suhu": "Ideal", "ph": "Netral", "kelembapan": "Sedang" }, "then": "Buruk" },
    { "id": 15, "if": { "bau": "Bau Busuk", "suhu": "Dingin", "ph": "Asam", "kelembapan": "Kering" }, "then": "Buruk" },
    { "id": 16, "if": { "bau": "Bau Busuk", "suhu": "Panas", "ph": "Basa", "kelembapan": "Basah" }, "then": "Buruk" }
  ]
}
