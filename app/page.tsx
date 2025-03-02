import { prisma } from "./db/prisma";
import { Suspense } from "react";
import LoadingSpinner from "./components/LoadingSpinner";
import CartasPopulares from "./components/carta/CartasPopulares";
import CartaHeader from "./components/carta/CartaHeader";

export default async function Cartas() {
  const cartas = await prisma.carta.findMany();

  return (
    <>
      <Suspense fallback={<LoadingSpinner />}>
        <CartaHeader cartas={cartas} />
      </Suspense >
      <CartasPopulares section="reino" title="Cartas populares del reino" />
      <CartasPopulares section="boveda" title="Cartas populares de la bóveda" />
    </>
  );
}
