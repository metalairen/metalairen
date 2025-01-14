"use client";

import { useEffect, useState } from "react";
import { Carta, MazoCarta } from "@prisma/client";
import MazoCartaItem from "./MazoCartaItem";
import { initFlowbite } from "flowbite";

export default function MazoSectionGrid({ cartas, section, cols }: { cartas: (MazoCarta & { carta: Carta })[], section: string, cols: number }) {
    useEffect(() => {
        initFlowbite();
    }, []);
    
    const [selectedCard, setSelectedCard] = useState<Carta | null>(null);

    const closeModal = () => {
        setSelectedCard(null);
    };

    return (
        <div>
            <h5 className="mb-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-white">{section}</h5>
            <div>
                <div className={`grid grid-cols-${cols} gap-1`}>
                    {Array.from({ length: cols }, (_, colIndex) => (
                        <div key={colIndex} className="relative h-[400px]">
                            {cartas
                                .filter((_, index) => index % cols === colIndex)
                                .map((carta, index) => (
                                    <button key={carta.carta.id} data-modal-target={`modal-${section}`} data-modal-toggle={`modal-${section}`} type="button">
                                        <div

                                            style={{ top: `${index * 80}px` }}
                                            className="absolute"
                                            onClick={() => setSelectedCard(carta.carta)} // Abrir modal al hacer click
                                        >
                                            <MazoCartaItem carta={carta.carta} cantidad={carta.cantidad} />
                                        </div>
                                    </button>
                                ))}
                        </div>
                    ))}
                </div>
            </div>
            <div id={`modal-${section}`} tabIndex={-1} aria-hidden="true" className="hidden overflow-y-auto overflow-x-hidden fixed top-0 right-0 left-0 z-50 justify-center items-center w-full md:inset-0 h-[calc(100%-1rem)] max-h-full">
                <div className="relative w-full max-w-md max-h-full">
                    <div className="relative bg-white rounded-lg shadow dark:bg-gray-700">
                        <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t dark:border-gray-600">
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                                {selectedCard?.nombre}
                            </h3>
                            <button onClick={() => { closeModal() }} type="button" className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white" data-modal-hide={`modal-${section}`}>
                                <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6" />
                                </svg>
                                <span className="sr-only">Close modal</span>
                            </button>
                        </div>
                        <div className="p-4 md:p-5 space-y-4">
                            <img src={selectedCard?.imagen} alt={selectedCard?.nombre} className="rounded-lg" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
