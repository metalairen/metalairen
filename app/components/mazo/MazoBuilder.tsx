"use client";

import { useEffect, useState } from "react";
import CartaSearch from "../carta/CartaSearch";
import { MazoSections } from "./MazoSections";
import { Carta } from "@prisma/client";
import SearchBar from "../SearchBar";
import { CartaCantidad } from "../mazo/MazoSection";
import { useSearchParams } from "next/navigation";
import MazoCostesStack from "../mazo/MazoCostesStack";
import CartaFilters from "../carta/CartaFilters";
import { addBulkCartaQueryParams, addSubtiposQueryParams, agregarMazoQueryParams, calcularPuntosBoveda, crearMazoQueryParams } from "@/app/util/mazoUtil";
import { useSession } from "next-auth/react";

export interface MazoTemporal {
    reino: Carta[];
    boveda: Carta[];
    sideboard: Carta[];
}

export default function MazoBuilder({ cartas, mazoGuardado, subtipo1Guardado, subtipo2Guardado, nombreGuardado, publicoGuardado, onGuardarMazo }: {
    cartas: Carta[],
    mazoGuardado?: MazoTemporal,
    subtipo1Guardado?: string | null,
    subtipo2Guardado?: string | null,
    nombreGuardado?: string | null,
    publicoGuardado?: boolean,
    publico?: boolean,
    onGuardarMazo: (mazo: MazoTemporal, nombre: string, subtipo1: string, subtipo2: string, publico: boolean) => void 
}) {
    const [mazo, setMazo] = useState<MazoTemporal>(mazoGuardado || { reino: [], boveda: [], sideboard: [] });
    const [bovedaPuntos, setBovedaPuntos] = useState(mazoGuardado ? calcularPuntosBoveda(mazoGuardado.boveda) : 0);
    const [subtipo1, setSubtipo1] = useState<string | null>(subtipo1Guardado || null);
    const [subtipo2, setSubtipo2] = useState<string | null>(subtipo2Guardado || null);
    const [nombre, setNombre] = useState<string | null>(nombreGuardado || "Mazo");
    const [publico, setPublico] = useState<boolean>(publicoGuardado || false);
    const [errors, setErrors] = useState<string[]>([]);
    const searchParams = useSearchParams();


    useEffect(() => {
        if (mazoGuardado) {
            agregarMazoQueryParams(searchParams, mazo, subtipo1Guardado, subtipo2Guardado);
        } else {
            const mazoQueryParams = crearMazoQueryParams(searchParams, cartas);

            setMazo(mazoQueryParams);

            if (mazoQueryParams.boveda.length > 0) {
                setBovedaPuntos(calcularPuntosBoveda(mazoQueryParams.boveda));
            }
        }
    }, []);

    const handleGuardarMazo = async () => {
        const subtipo1 = searchParams.get("subtipo1") || subtipo1Guardado || "";
        const subtipo2 = searchParams.get("subtipo2") || subtipo2Guardado || "";

        onGuardarMazo(mazo, nombre || "Mazo", subtipo1, subtipo2, publico);
    }

    const handleCartaClick = (carta: Carta) => {
        if (carta.tipo === 'TESORO') {
            if (mazo.boveda.length < 15) {
                const cartaFound = mazo.boveda.find((c) => c.id === carta.id);
                if (!cartaFound || (cartaFound && cartaFound.nombre === 'TESORO GENERICO')) {
                    setMazo((prevMazo) => ({
                        ...prevMazo,
                        boveda: [...prevMazo.boveda, carta],
                    }));
                    if (carta.nombre === 'TESORO GENERICO') {
                        console.log("es un tesoro generico");
                        setBovedaPuntos((prevPuntos) => prevPuntos - 1);
                    } else {
                        setBovedaPuntos((prevPuntos) => prevPuntos + carta.coste);
                    }
                    addCartaQueryParams(carta, 'boveda');
                }
            }
        } else {
            const cartaAmount = mazo.reino.filter((c) => c.id === carta.id).length;

            if (cartaAmount < 4) {
                setMazo((prevMazo) => ({
                    ...prevMazo,
                    reino: [...prevMazo.reino, carta],
                }));
                addCartaQueryParams(carta, 'reino');
            }
        }
    }

    const handleCartaPlusClick = (carta: Carta) => {
        if (carta.tipo !== 'TESORO') {
            const cartaReinoAmount = mazo.reino.filter((c) => c.id === carta.id).length;
            const cartaSidedeckAmount = mazo.sideboard.filter((c) => c.id === carta.id).length;
            const cartaAmount = cartaReinoAmount + cartaSidedeckAmount;
            if (cartaAmount < 4) {
                setMazo((prevMazo) => ({
                    ...prevMazo,
                    reino: [...prevMazo.reino, carta],
                }));
                addCartaQueryParams(carta, 'reino');
            }
        } else {
            if (mazo.boveda.length < 15) {
                if (carta.nombre === 'TESORO GENERICO') {
                    setMazo((prevMazo) => ({
                        ...prevMazo,
                        boveda: [...prevMazo.boveda, carta],
                    }));
                    setBovedaPuntos((prevPuntos) => prevPuntos - 1);
                    addCartaQueryParams(carta, 'boveda');
                }
            }
        }

    }

    const handleCartaMinusClick = (carta: Carta) => {
        if (carta.tipo !== 'TESORO') {
            setMazo((prevMazo) => {
                const index = prevMazo.reino.findIndex((c) => c.id === carta.id);
                if (index === -1) return prevMazo;

                return {
                    ...prevMazo,
                    reino: [
                        ...prevMazo.reino.slice(0, index),
                        ...prevMazo.reino.slice(index + 1),
                    ],
                };
            });

            removeCartaQueryParams(carta, 'reino');
        } else {
            setMazo((prevMazo) => {
                const index = prevMazo.boveda.findIndex((c) => c.id === carta.id);
                if (index === -1) return prevMazo;

                return {
                    ...prevMazo,
                    boveda: [
                        ...prevMazo.boveda.slice(0, index),
                        ...prevMazo.boveda.slice(index + 1),
                    ],
                };
            });
            if (carta.nombre === 'TESORO GENERICO') {
                setBovedaPuntos((prevPuntos) => prevPuntos + 1);
            } else {
                setBovedaPuntos((prevPuntos) => prevPuntos - carta.coste);
            }
            removeCartaQueryParams(carta, 'boveda');
        }
    }

    const handleCartaSideboardClick = (carta: Carta, fromSection: string) => {
        if (fromSection === 'reino') {
            setMazo((prevMazo) => {
                const index = prevMazo.reino.findIndex((c) => c.id === carta.id);
                if (index === -1) return prevMazo;

                return {
                    ...prevMazo,
                    reino: [
                        ...prevMazo.reino.slice(0, index),
                        ...prevMazo.reino.slice(index + 1),
                    ],
                    sideboard: [...prevMazo.sideboard, carta]
                };
            });

            switchCartaQueryParams(carta, 'reino', 'sideboard');
        } else {
            setMazo((prevMazo) => {
                const index = prevMazo.sideboard.findIndex((c) => c.id === carta.id);
                if (index === -1) return prevMazo;

                return {
                    ...prevMazo,
                    sideboard: [
                        ...prevMazo.sideboard.slice(0, index),
                        ...prevMazo.sideboard.slice(index + 1),
                    ],
                    reino: [...prevMazo.reino, carta]
                };
            });

            switchCartaQueryParams(carta, 'sideboard', 'reino');
        }
    }

    const handleImportClick = async () => {
        const text = await navigator.clipboard.readText();
        const mazo = procesarListaMazo(text, cartas);
        const bovedaPuntos = mazo.boveda.reduce((acc, carta) => acc + carta.coste, 0);
        setBovedaPuntos(bovedaPuntos);
        addBulkCartaQueryParams(searchParams, mazo);
        setMazo(mazo);
    }

    const handleExportClick = () => {
        const errors = validateMazo(mazo, searchParams.get('subtipo1') || '', searchParams.get('subtipo2') || '');
        setErrors(errors);
        if (errors.length === 0) {
            console.log("exporto");
            const mazoString = exportarListaMazo(mazo);
            navigator.clipboard.writeText(mazoString);
        }
    }

    const getFormattedDate = () => {
        const now = new Date();

        const pad = (num: number) => num.toString().padStart(2, '0');

        const day = pad(now.getDate());
        const month = pad(now.getMonth() + 1);
        const year = now.getFullYear().toString().slice(-2);
        const hours = pad(now.getHours());
        const minutes = pad(now.getMinutes());
        const seconds = pad(now.getSeconds());

        return `${day}${month}${year}${hours}${minutes}${seconds}`;
    };

    const handleDownloadClick = () => {
        const errors = validateMazo(mazo, searchParams.get('subtipo1') || '', searchParams.get('subtipo2') || '');
        setErrors(errors);
        if (errors.length === 0) {
            const mazoString = exportarListaMazo(mazo);
            const blob = new Blob([mazoString], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);

            const subtipo1 = searchParams.get('subtipo1')?.toLowerCase() || '';
            const subtipo2 = searchParams.get('subtipo2')?.toLowerCase() || '';

            const link = document.createElement('a');

            if (subtipo1 && subtipo2) {
                link.download = `mazo-${subtipo1}-${subtipo2}-${getFormattedDate()}.txt`;
            } else if (subtipo1) {
                link.download = `mazo-${subtipo1}-${getFormattedDate()}.txt`;
            } else if (subtipo2) {
                link.download = `mazo-${subtipo2}-${getFormattedDate()}.txt`;
            } else {
                link.download = `mazo-${getFormattedDate()}.txt`;
            }

            link.href = url;
            link.click();

            URL.revokeObjectURL(url);
        }
    }

    const switchCartaQueryParams = (carta: Carta, fromSection: string, toSection: string) => {
        const currentParams = searchParams?.toString() || '';
        const params = new URLSearchParams(currentParams);

        const fromSectionParams = searchParams.get(fromSection);
        const toSectionParams = searchParams.get(toSection);

        const toSectionArray = toSectionParams ? toSectionParams.split(';') : [];
        toSectionArray.push(carta.id.toString());
        params.set(toSection, toSectionArray.join(';'));

        if (fromSectionParams) {
            const fromSectionArray = fromSectionParams.split(';');
            const index = fromSectionArray.findIndex((c) => c === carta.id.toString());
            if (index !== -1) {
                fromSectionArray.splice(index, 1);
                params.set(fromSection, fromSectionArray.join(';'));
                if (fromSectionArray.length === 0) {
                    params.delete(fromSection);
                }
            }
        }

        window.history.replaceState(null, '', `?${params.toString()}`);
    }

    const addCartaQueryParams = (carta: Carta, section: string) => {
        const currentParams = searchParams?.toString() || '';
        const params = new URLSearchParams(currentParams);
        const sectionParams = searchParams.get(section);

        const updatedReinoArray = sectionParams ? sectionParams.split(';') : [];
        updatedReinoArray.push(carta.id.toString());

        params.set(section, updatedReinoArray.join(';'));
        window.history.replaceState(null, '', `?${params.toString()}`);
    };

    const removeCartaQueryParams = (carta: Carta, section: string) => {
        const sectionParams = searchParams.get(section);
        const params = new URLSearchParams(searchParams?.toString() || '');

        if (sectionParams) {
            const reinoArray = sectionParams.split(';');
            const index = reinoArray.findIndex((c) => c === carta.id.toString());
            if (index !== -1) {
                reinoArray.splice(index, 1);
                params.set(section, reinoArray.join(';'));
                if (reinoArray.length === 0) {
                    params.delete(section);
                }
                window.history.replaceState(null, '', `?${params.toString()}`);
            }
        }
    }

    function exportarListaMazo(mazo: MazoTemporal): string {
        const reinoReduced = Object.values(
            mazo.reino.reduce((acc: Record<number, CartaCantidad>, carta) => {
                if (acc[carta.id]) {
                    acc[carta.id].cantidad++;
                } else {
                    acc[carta.id] = { ...carta, cantidad: 1 };
                }
                return acc;
            }, {})
        );
        const sideboardReduced = Object.values(
            mazo.sideboard.reduce((acc: Record<number, CartaCantidad>, carta) => {
                if (acc[carta.id]) {
                    acc[carta.id].cantidad++;
                } else {
                    acc[carta.id] = { ...carta, cantidad: 1 };
                }
                return acc;
            }, {})
        );
        const bovedaReduced = Object.values(
            mazo.boveda.reduce((acc: Record<number, CartaCantidad>, carta) => {
                if (acc[carta.id]) {
                    acc[carta.id].cantidad++;
                } else {
                    acc[carta.id] = { ...carta, cantidad: 1 };
                }
                return acc;
            }, {})
        );

        const reino = reinoReduced.map((carta) => `${carta.nombre} x${carta.cantidad}`).join('\n');
        const boveda = bovedaReduced.map((carta) => `${carta.nombre} x${carta.cantidad}`).join('\n');
        const sideboard = sideboardReduced.map((carta) => `${carta.nombre} x${carta.cantidad}`).join('\n');

        return `Reino: (total: ${mazo.reino.length})\n${reino}\n\nBóveda: (total: ${mazo.boveda.length})\n${boveda}\n\nSide Deck: (total: ${mazo.sideboard.length})\n${sideboard}`;
    }

    function procesarListaMazo(mazo: string, cartas: Carta[]): MazoTemporal {
        const lines = mazo.trim().split(/\r\n|\n|\r/);
        const sections: MazoTemporal = {
            reino: [],
            boveda: [],
            sideboard: []
        };
        let currentSection: keyof MazoTemporal | '' = '';

        for (const line of lines) {
            const trimmedLine = line.trim();

            if (trimmedLine.startsWith('Reino:')) {
                currentSection = 'reino';
                continue;
            }

            if (trimmedLine.startsWith('Bóveda:')) {
                currentSection = 'boveda';
                continue;
            }

            if (trimmedLine.startsWith('Side Deck:')) {
                currentSection = 'sideboard';
                continue;
            }

            if (currentSection) {
                const cartasProcesadas = procesarCarta(trimmedLine, cartas);
                if (cartasProcesadas) {
                    sections[currentSection].push(...cartasProcesadas);
                }
            }
        }

        return sections;
    }

    function procesarCarta(line: string, cartas: Carta[]): Carta[] | undefined {
        const match = line.match(/(.+?)\s+x(\d+)/);
        if (match) {
            const nombre = match[1].trim();
            const cantidad = parseInt(match[2].trim(), 10);
            const carta = cartas.find((c) => c.nombre === nombre);

            if (carta) {
                return Array(cantidad).fill(carta);
            }
        }
        return undefined;
    }

    const validateMazo = (mazo: MazoTemporal, subtipo1: string, subtipo2: string): string[] => {
        const REINO_MAX = 60;
        const REINO_MIN = 45;
        const SIDEDECK_MAX = 7;
        const BOVEDA_MAX = 15;
        //const REINO_CARD_LIMIT = 4;
        //const BOVEDA_CARD_LIMIT = 1;
        const BOVEDA_PUNTOS_MAX = 30;

        const errors: string[] = [];

        if (mazo.reino.length < REINO_MIN) {
            errors.push(`El mazo debe tener al menos ${REINO_MIN} cartas en el reino.`);
        }

        if (mazo.reino.length > REINO_MAX) {
            errors.push(`El mazo no puede tener más de ${REINO_MAX} cartas en el reino.`);
        }

        if (mazo.sideboard.length < SIDEDECK_MAX) {
            errors.push(`El mazo debe tener al menos ${SIDEDECK_MAX} cartas en el sidedeck.`);
        }

        if (mazo.sideboard.length > SIDEDECK_MAX) {
            errors.push(`El mazo no puede tener más de ${SIDEDECK_MAX} cartas en el sidedeck.`);
        }

        if (mazo.boveda.length < BOVEDA_MAX) {
            errors.push(`El mazo debe tener al menos ${BOVEDA_MAX} cartas en la bóveda.`);
        }

        if (mazo.boveda.length > BOVEDA_MAX) {
            errors.push(`El mazo no puede tener más de ${BOVEDA_MAX} cartas en la bóveda.`);
        }

        if (!subtipo1 || !subtipo2) {
            errors.push('Los subtipos son requeridos.');
        }

        if (bovedaPuntos > BOVEDA_PUNTOS_MAX) {
            errors.push(`La bóveda no puede tener más de ${BOVEDA_PUNTOS_MAX} puntos.`);
        }

        return errors;
    }

    return (

        <div className="p-4">
            <SearchBar filters={CartaFilters()} />
            <div className="pt-4 grid md:grid-cols-5 lg:grid-cols-3 gap-8">
                <div className="md:col-span-2 lg:col-span-1">
                    <MazoSections
                        mazo={mazo}
                        nombre={nombre || "Mazo"}
                        publico={publico}
                        onPlusClick={handleCartaPlusClick}
                        onMinusClick={handleCartaMinusClick}
                        onSideboardClick={handleCartaSideboardClick}
                        onImportClick={handleImportClick}
                        onExportClick={handleExportClick}
                        onDownloadClick={handleDownloadClick}
                        onGuardarMazo={handleGuardarMazo}
                        onCambiarNombre={(nombre: string) => setNombre(nombre)}
                        onCambiarPublico={(publico: boolean) => setPublico(publico)}
                        validationErrors={errors}
                        bovedaPuntos={bovedaPuntos} />
                </div>
                <div className="md:col-span-3 lg:col-span-2">
                    <CartaSearch cartas={cartas} onCartaClick={handleCartaClick} />
                    {mazo.reino.length > 0 &&
                        <div className="hidden lg:block">
                            <MazoCostesStack cartas={mazo.reino} />
                        </div>
                    }
                </div>
            </div>
        </div>
    );
}