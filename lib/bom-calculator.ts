import type {
  FloorPlanLayout,
  BuildingStorey,
  SceneObject,
  Staircase,
  BomReport,
  BomItem,
  ComplianceViolation,
} from "@/types/puter";

const FLOOR_MATERIAL_PRICES: Record<string, { label: string; ratePerSqFt: number }> = {
  hardwood: { label: "Engineered White Oak Hardwood Flooring", ratePerSqFt: 11.5 },
  tile: { label: "Porcelain Large-Format Architectural Tile", ratePerSqFt: 8.75 },
  marble: { label: "Honed Carrara Marble Slab Flooring", ratePerSqFt: 24.0 },
  carpet: { label: "Commercial Tufted Acoustic Broadloom Carpet", ratePerSqFt: 5.5 },
  concrete: { label: "Polished Micro-Topped Architectural Concrete", ratePerSqFt: 9.0 },
  terrazzo: { label: "Epoxy Aggregate Terrazzo Finish", ratePerSqFt: 18.5 },
};

/**
 * Deterministic Live Bill of Materials (BOM) & IBC/IRC/ADA Code Compliance Engine.
 * Recomputes structural framing, concrete, drywall, openings, floor finishes,
 * furnishings, and building code compliance on every CAD state change.
 */
export function computeLiveBomAndCompliance(
  activeLayout: FloorPlanLayout | null,
  storeys: BuildingStorey[] = [],
  sceneObjects: SceneObject[] = [],
  staircases: Staircase[] = []
): { bomReport: BomReport | null; violations: ComplianceViolation[] } {
  const effectiveLayouts: FloorPlanLayout[] =
    storeys.length > 0
      ? storeys.map((s) => s.floorPlanLayout).filter((l): l is FloorPlanLayout => Boolean(l))
      : activeLayout
        ? [activeLayout]
        : [];

  if (effectiveLayouts.length === 0) {
    return { bomReport: null, violations: [] };
  }

  let totalLoadBearingLft = 0;
  let totalPartitionLft = 0;
  let totalWallSurfaceSqFt = 0;
  let totalOpeningsSqFt = 0;

  let exteriorDoorCount = 0;
  let interiorDoorCount = 0;
  let windowCount = 0;
  let totalWindowSqFt = 0;

  const flooringByType: Record<string, number> = {};
  let totalSlabSqFt = 0;

  const violations: ComplianceViolation[] = [];

  effectiveLayouts.forEach((layout, levelIdx) => {
    const levelLabel = storeys[levelIdx]?.name || `Level ${levelIdx + 1}`;

    // 1. Walls
    layout.walls.forEach((wall) => {
      const lenFt = Math.hypot(wall.end.x - wall.start.x, wall.end.y - wall.start.y);
      if (lenFt < 0.25) return;

      if (wall.isLoadBearing) {
        totalLoadBearingLft += lenFt;
      } else {
        totalPartitionLft += lenFt;
      }

      const wallHeightFt = wall.height || 9;
      totalWallSurfaceSqFt += lenFt * wallHeightFt * 2; // Both sides of wall
    });

    // 2. Doors & ADA checks
    layout.doors.forEach((door) => {
      const widthIn = door.width || 36;
      const heightIn = door.height || 80;
      const areaSqFt = (widthIn / 12) * (heightIn / 12);
      totalOpeningsSqFt += areaSqFt * 2;

      if (door.isExterior) {
        exteriorDoorCount += 1;
      } else {
        interiorDoorCount += 1;
      }

      if (widthIn < 32) {
        violations.push({
          code: "ADA-404.2.3",
          severity: "warning",
          elementId: door.id,
          message: `${levelLabel}: Doorway "${door.id.slice(0, 10)}" has a ${widthIn}" opening, below the 32" minimum ADA clear width.`,
          recommendation: "Increase door width to at least 32 inches (36 inches recommended for primary circulation).",
        });
      }
    });

    // 3. Windows
    layout.windows.forEach((win) => {
      const widthIn = win.width || 48;
      const heightIn = win.height || 48;
      const areaSqFt = (widthIn / 12) * (heightIn / 12);
      totalOpeningsSqFt += areaSqFt * 2;
      windowCount += 1;
      totalWindowSqFt += areaSqFt;

      if (win.sillHeight !== undefined && win.sillHeight > 44) {
        violations.push({
          code: "IRC-R310.2.2",
          severity: "info",
          elementId: win.id,
          message: `${levelLabel}: Window sill height (${win.sillHeight}") exceeds the 44" maximum for emergency escape and rescue openings.`,
          recommendation: "Lower sill height to 44 inches or less if this window serves as a bedroom egress opening.",
        });
      }
    });

    // 4. Rooms, Flooring & IRC Habitable Room Checks
    layout.rooms.forEach((room) => {
      const area = Math.max(0, Math.round(room.area || room.bounds.width * room.bounds.height));
      totalSlabSqFt += area;

      if (!room.noTexture) {
        const matKey = (room.floorMaterial || "hardwood").toLowerCase();
        flooringByType[matKey] = (flooringByType[matKey] || 0) + area;
      }

      const minDim = Math.min(room.bounds.width, room.bounds.height);
      const isHabitable =
        room.type === "bedroom" ||
        room.type === "living" ||
        room.type === "dining" ||
        room.type === "office";

      if (isHabitable && area > 0 && area < 70) {
        violations.push({
          code: "IRC-R304.1",
          severity: "error",
          elementId: room.id,
          message: `${levelLabel}: "${room.label}" is ${area} sq ft, below the 70 sq ft minimum required for habitable rooms.`,
          recommendation: "Expand room perimeter walls so total enclosed floor area is at least 70 sq ft.",
        });
      }

      if (isHabitable && minDim > 0 && minDim < 7) {
        violations.push({
          code: "IRC-R304.2",
          severity: "warning",
          elementId: room.id,
          message: `${levelLabel}: "${room.label}" has a narrow span of ${minDim.toFixed(1)} ft (minimum 7.0 ft required in any horizontal direction).`,
          recommendation: "Adjust wall positions to provide at least 7'-0\" clear width.",
        });
      }

      // Check bedroom egress (IRC-R310.1)
      if (room.type === "bedroom" && room.wallIds && room.wallIds.length > 0) {
        const hasWindow = layout.windows.some((w) => room.wallIds?.includes(w.wallId));
        const hasExteriorDoor = layout.doors.some(
          (d) => d.isExterior && room.wallIds?.includes(d.wallId)
        );
        if (!hasWindow && !hasExteriorDoor && layout.windows.length > 0) {
          violations.push({
            code: "IRC-R310.1",
            severity: "warning",
            elementId: room.id,
            message: `${levelLabel}: "${room.label}" lacks a dedicated exterior egress window or exterior door.`,
            recommendation: "Add an operable casement or double-hung window on an exterior wall of this bedroom.",
          });
        }
      }
    });
  });

  // 5. Staircases & IRC-R311.7 Checks
  staircases.forEach((stair, idx) => {
    if (stair.width < 36) {
      violations.push({
        code: "IRC-R311.7.1",
        severity: "warning",
        elementId: stair.id,
        message: `Staircase #${idx + 1} width (${stair.width}") is narrower than the 36" minimum code requirement.`,
        recommendation: "Increase staircase clear width to at least 36 inches.",
      });
    }
    if (stair.riserHeight > 7.75) {
      violations.push({
        code: "IRC-R311.7.5.1",
        severity: "error",
        elementId: stair.id,
        message: `Staircase #${idx + 1} riser height (${stair.riserHeight}") exceeds the 7.75" maximum allowed by IRC.`,
        recommendation: "Reduce riser height to 7.75 inches or less and add additional risers.",
      });
    }
  });

  // Assemble BOM Items
  const items: BomItem[] = [];

  if (totalLoadBearingLft > 0) {
    const qty = Math.round(totalLoadBearingLft);
    items.push({
      category: "Structure",
      name: "2x6 Structural Load-Bearing Wall Framing & Sheathing",
      quantity: qty,
      unit: "LFT",
      estimatedCost: Math.round(qty * 42),
    });
  }

  if (totalPartitionLft > 0) {
    const qty = Math.round(totalPartitionLft);
    items.push({
      category: "Structure",
      name: "2x4 Interior Partition Framing & Acoustic Batt",
      quantity: qty,
      unit: "LFT",
      estimatedCost: Math.round(qty * 26),
    });
  }

  const fallbackFootprint =
    activeLayout ? activeLayout.dimensions.width * activeLayout.dimensions.height : 0;
  const effectiveSlabSqFt = totalSlabSqFt > 0 ? totalSlabSqFt : fallbackFootprint;
  if (effectiveSlabSqFt > 0) {
    const slabCubicYards = Math.max(1, Math.round((effectiveSlabSqFt * 0.67) / 27));
    items.push({
      category: "Foundation & Slabs",
      name: "Reinforced Concrete Floor Slab (4000 PSI w/ Rebar Mesh)",
      quantity: slabCubicYards,
      unit: "CYD",
      estimatedCost: Math.round(slabCubicYards * 195),
    });
  }

  const netDrywallSqFt = Math.max(0, Math.round(totalWallSurfaceSqFt - totalOpeningsSqFt));
  if (netDrywallSqFt > 0) {
    items.push({
      category: "Finishes",
      name: '5/8" Type-X Gypsum Drywall & Level-4 Skim Coat',
      quantity: netDrywallSqFt,
      unit: "SFT",
      estimatedCost: Math.round(netDrywallSqFt * 3.25),
    });
  }

  Object.entries(flooringByType).forEach(([matKey, sqFt]) => {
    if (sqFt <= 0) return;
    const spec = FLOOR_MATERIAL_PRICES[matKey] || {
      label: `${matKey.charAt(0).toUpperCase() + matKey.slice(1)} Architectural Flooring`,
      ratePerSqFt: 10.0,
    };
    const roundedSqFt = Math.round(sqFt * 1.08); // Include 8% waste factor
    items.push({
      category: "Flooring",
      name: spec.label,
      quantity: roundedSqFt,
      unit: "SFT",
      estimatedCost: Math.round(roundedSqFt * spec.ratePerSqFt),
    });
  });

  if (exteriorDoorCount > 0) {
    items.push({
      category: "Openings",
      name: "Insulated Fiberglass / Solid Core Exterior Entry Door Assembly",
      quantity: exteriorDoorCount,
      unit: "PCS",
      estimatedCost: exteriorDoorCount * 1150,
    });
  }

  if (interiorDoorCount > 0) {
    items.push({
      category: "Openings",
      name: "Solid-Core Flush Architectural Interior Door & Hardware",
      quantity: interiorDoorCount,
      unit: "PCS",
      estimatedCost: interiorDoorCount * 420,
    });
  }

  if (windowCount > 0) {
    items.push({
      category: "Openings",
      name: "Low-E Argon Double-Glazed Thermally Broken Windows",
      quantity: windowCount,
      unit: "PCS",
      estimatedCost: Math.round(windowCount * 680 + totalWindowSqFt * 18),
    });
  }

  if (staircases.length > 0) {
    items.push({
      category: "Vertical Circulation",
      name: "Engineered Oak & Brushed Brass Architectural Staircase Flight",
      quantity: staircases.length,
      unit: "SET",
      estimatedCost: staircases.length * 4800,
    });
  }

  if (sceneObjects.length > 0) {
    const lightsCount = sceneObjects.filter(
      (o) => o.type === "light" || o.attachmentType === "ceiling"
    ).length;
    const furnitureCount = sceneObjects.length - lightsCount;

    if (furnitureCount > 0) {
      items.push({
        category: "FF&E Furnishings",
        name: "Curated Contract-Grade Interior Furniture Assets",
        quantity: furnitureCount,
        unit: "PCS",
        estimatedCost: furnitureCount * 850,
      });
    }
    if (lightsCount > 0) {
      items.push({
        category: "MEP & Lighting",
        name: "Architectural LED Luminaires & Pendants",
        quantity: lightsCount,
        unit: "PCS",
        estimatedCost: lightsCount * 340,
      });
    }
  }

  const totalEstimatedCost = items.reduce((sum, item) => sum + (item.estimatedCost || 0), 0);

  return {
    bomReport: {
      items,
      totalEstimatedCost,
      currency: "USD",
      generatedAt: new Date().toISOString(),
    },
    violations,
  };
}
