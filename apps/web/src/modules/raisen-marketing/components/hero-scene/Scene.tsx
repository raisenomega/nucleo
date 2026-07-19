import { Stars } from "@react-three/drei";
import { WarpStars } from "@raisen-marketing/components/hero-scene/WarpStars";
import { CometParticles } from "@raisen-marketing/components/hero-scene/CometParticles";
import { DiamondMesh } from "@raisen-marketing/components/hero-scene/DiamondMesh";

// Composición de la escena 3D (luces + 2 capas de estrellas drei + warp + cometas + diamante). Portado OMEGA.
export function Scene() {
  return (
    <>
      <ambientLight intensity={0.1} />
      <pointLight position={[5, 5, 5]} intensity={0.6} color={0xeea62b} />
      <pointLight position={[-5, -3, 3]} intensity={0.3} color={0xffffff} />
      <Stars radius={100} depth={200} count={7000} factor={5} saturation={0} fade speed={0.2} />
      <Stars radius={150} depth={300} count={7000} factor={3} saturation={0} fade speed={0.15} />
      <WarpStars />
      <CometParticles />
      <DiamondMesh />
    </>
  );
}
