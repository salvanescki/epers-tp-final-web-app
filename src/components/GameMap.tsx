import { useState } from "react";
import { useAuth } from "../auth/useAuth";
import { MAP_ZONES } from "../data/MAP_ZONES";
import "../styles/game-map.css";
import { spawnearEspiritu } from "../api/api.ts";

export const GameMap = () => {
  const { profile, selectedClass, nightBringerId } = useAuth();

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedZone, setSelectedZone] = useState<any | null>(null);
  const [nombreEspiritu, setNombreEspiritu] = useState("");

  const openModal = (zone: any) => {
    if (selectedClass !== "nightbringer") return;
    setSelectedZone(zone);
    setNombreEspiritu("");
    setModalOpen(true);
  };

  const spawn = async () => {
    if (!nightBringerId) return alert("NightBringer no creado");
    try {
      await spawnearEspiritu(
        nightBringerId,
        selectedZone.id,
        nombreEspiritu || "Espíritu"
      );
      setModalOpen(false);
    } catch (e) {
      console.error(e);
      alert("Error al spawnear");
    }
  };

  return (
    <div className="map-wrapper">
      {/* canvas central de mapa */}
      <div className="map-canvas">
        {MAP_ZONES.map((z) => (
          <div
            key={z.id}
            className="zone"
            onClick={() => openModal(z)}
            style={{
              left: `${z.x}%`,
              top: `${z.y}%`,
              width: `${z.w}%`,
              height: `${z.h}%`,
            }}
          >
            <span className="zone-name">{z.name}</span>
          </div>
        ))}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#111] border-2 border-primary p-6 w-80 flex flex-col gap-4 shadow-retro">
            <h2 className="text-primary text-center">INVOCAR ESPÍRITU</h2>

            <p className="text-xs text-muted-foreground">
              Zona: <span className="text-primary">{selectedZone?.name}</span>
            </p>

            <input
              className="bg-card border border-primary/40 text-xs p-2"
              placeholder="Nombre del espíritu..."
              value={nombreEspiritu}
              onChange={(e) => setNombreEspiritu(e.target.value)}
            />

            <button
              onClick={spawn}
              className="bg-primary text-white px-3 py-2 border-2 border-primary shadow-retro"
            >
              SPAWNEAR
            </button>

            <button
              onClick={() => setModalOpen(false)}
              className="bg-destructive text-white px-3 py-2 border-2 border-destructive shadow-retro"
            >
              CANCELAR
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
