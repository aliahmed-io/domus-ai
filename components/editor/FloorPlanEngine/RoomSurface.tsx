"use client";
import { stairOpening } from "@/lib/building-levels";
import { RepeatWrapping, SRGBColorSpace } from "three";
import { useTexture } from "@react-three/drei";
import { useMemo, useEffect } from "react";
import { Geometry, Base, Subtraction } from "@react-three/csg";
import type { Room, Staircase } from "@/types/puter";
import { roomSurfaceGeometry } from "@/lib/room-shape";
function WoodMaterial({
  color,
  roughness,
  metalness,
  selected,
}: {
  color: string;
  roughness: number;
  metalness: number;
  selected: boolean;
}) {
  const source = useTexture("/materials/oak-grain.svg");
  const texture = useMemo(() => {
    const map = source.clone();
    map.wrapS = RepeatWrapping;
    map.wrapT = RepeatWrapping;
    map.colorSpace = SRGBColorSpace;
    map.needsUpdate = true;
    return map;
  }, [source]);
  useEffect(() => () => texture.dispose(), [texture]);
  return (
    <meshStandardMaterial
      map={texture}
      color={color}
      roughness={roughness}
      metalness={metalness}
      emissive={selected ? "#8b6245" : "#000000"}
      emissiveIntensity={selected ? 0.15 : 0}
    />
  );
}
export default function RoomSurface({
  room,
  thickness,
  top,
  color,
  roughness = 0.8,
  metalness = 0,
  stairs = [],
  wood = false,
  selected = false,
  onSelect,
}: {
  room: Room;
  thickness: number;
  top: number;
  color: string;
  roughness?: number;
  metalness?: number;
  stairs?: Staircase[];
  wood?: boolean;
  selected?: boolean;
  onSelect?: () => void;
}) {
  const geometry = useMemo(
    () => roomSurfaceGeometry(room, thickness),
    [room, thickness],
  );
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <mesh
      position={[0, top, 0]}
      receiveShadow
      castShadow
      onClick={(event) => {
        if (onSelect) {
          event.stopPropagation();
          onSelect();
        }
      }}
    >
      {stairs.length ? (
        <Geometry computeVertexNormals>
          <Base geometry={geometry} />
          {stairs.map((stair) => {
            const opening = stairOpening(stair);
            return <Subtraction
              key={stair.id}
              position={[opening.x, -thickness / 2, opening.z]}
              rotation={[0, stair.rotation.y, 0]}
            >
              <boxGeometry args={[opening.width, thickness * 3, opening.depth]} />
            </Subtraction>;
          })}
        </Geometry>
      ) : (
        <primitive object={geometry} attach="geometry" />
      )}
      {wood ? (
        <WoodMaterial
          color={color}
          roughness={roughness}
          metalness={metalness}
          selected={selected}
        />
      ) : (
        <meshStandardMaterial
          color={color}
          roughness={roughness}
          metalness={metalness}
          emissive={selected ? "#8b6245" : "#000000"}
          emissiveIntensity={selected ? 0.15 : 0}
        />
      )}
    </mesh>
  );
}
