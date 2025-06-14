import { Carta } from "@prisma/client";
import MazoCartaItem from "./MazoCartaItem";
import { useState } from "react";
import ReactDOM from "react-dom";

export default function MazoCostesStack({ cartas }: { cartas: Carta[] }) {
    const cartasPorCostesReduced = cartas.reduce((acc: Record<number, Carta & { cantidad: number }>, carta) => {
        if (acc[carta.id]) {
            acc[carta.id].cantidad++;
        } else {
            acc[carta.id] = { ...carta, cantidad: 1 };
        }
        return acc;
    }, {});

    const cartasPorCostes = Object.values(cartasPorCostesReduced).reduce((acc: Record<number, (Carta & { cantidad: number })[]>, carta) => {
        const coste = carta.coste >= 7 ? 7 : carta.coste;

        if (acc[coste]) {
            acc[coste].push(carta);
        } else {
            acc[coste] = [carta];
        }
        return acc;
    }, {});

    const [selectedCard, setSelectedCard] = useState<Carta | null>(null);

    const closeModal = () => setSelectedCard(null);

    const handleBackgroundClick = (event: React.MouseEvent<HTMLDivElement>) => {
        if (event.target === event.currentTarget) {
            closeModal();
        }
    };

    return (
        <div>
            <div className="grid grid-cols-8 gap-4 relative">
                {Array.from({ length: 8 }, (_, colIndex) => (
                    <div key={colIndex} className="relative rounded">
                        <div className="flex justify-center">
                            <span className="bg-yellow-100 text-yellow-800 text-xs font-medium me-2 px-2.5 py-0.5 rounded-sm dark:bg-yellow-300 dark:text-gray-900 content-center">
                                {colIndex === 7 ? "7+" : colIndex}
                            </span>
                        </div>
                        {cartasPorCostes[colIndex]?.map((carta, i) => (
                            <button key={carta.id} type="button" className="" onClick={() => setSelectedCard(carta)}>
                                <div style={{ top: `${i * 80 + 35}px` }} className="absolute">
                                    <MazoCartaItem key={carta.id} carta={carta} cantidad={carta.cantidad} />
                                </div>
                            </button>
                        ))}
                    </div>
                ))}
            </div>
            {selectedCard && ReactDOM.createPortal(
                <div
                    id="modal-reino"
                    tabIndex={-1}
                    className="flex overflow-y-auto overflow-x-hidden fixed top-0 right-0 left-0 z-50 justify-center items-center w-full md:inset-0 h-full max-h-full bg-gray-900 bg-opacity-50 backdrop-blur-sm"
                    aria-hidden="true"
                    onClick={handleBackgroundClick}
                >
                    <div className="relative w-full max-w-md max-h-full">
                        <div className="relative bg-white rounded-lg shadow dark:bg-gray-700">
                            <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t dark:border-gray-600">
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                                    {selectedCard.nombre}
                                </h3>
                                <button
                                    onClick={closeModal}
                                    type="button"
                                    className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white"
                                >
                                    <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6" />
                                    </svg>
                                    <span className="sr-only">Close modal</span>
                                </button>
                            </div>
                            <div className="p-4 md:p-5 space-y-4">
                                <img src={selectedCard.imagen} alt={selectedCard.nombre} className="rounded-lg" />
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
