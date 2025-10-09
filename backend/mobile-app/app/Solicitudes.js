const mongoose = require("mongoose");

const SolicitudSchema = new mongoose.Schema({
  mascota: { type: String, required: true },

  usuario: {
    id: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", required: true },
    nombre: { type: String, required: true }
  },

  refugio: {
    id: { type: mongoose.Schema.Types.ObjectId, ref: "Refugio", required: true },
    nombre: { type: String, required: true }
  },

  documentoUrl: { type: String, required: false },
  respuestasFormulario: { type: Object, required: true },

  estado: {
    type: String,
    enum: ["recibido", "revisando", "aprobado", "rechazado"],
    default: "recibido"
  },

  fechaCreacion: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Solicitud", SolicitudSchema);