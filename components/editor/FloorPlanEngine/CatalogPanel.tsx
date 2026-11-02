"use client";
import React, { useState } from "react";
import Image from "next/image";
import {
  Square,
  Plus,
  Scissors,
  Compass,
  Armchair,
  Heart,
  Loader2,
  Upload,
  FolderOpen,
} from "lucide-react";
import { useModelRequest } from "@/lib/use-model-request";
import { useEditorStore } from "@/store/useEditorStore";
import { useShallow } from "zustand/react/shallow";
import { nanoid, feetToMeters } from "@/lib/utils";
import type { SceneObject } from "@/types/puter";
import { toast } from "sonner";

const FURNITURE_CATALOG = [
  {
    category: "Seating",
    items: [
      {
        id: "furn-chair-1",
        name: "Søren Lounge Chair",
        modelUrl: "/models/kenney_furniture-kit/models/loungeChair.glb",
        color: "#8C7662",
        thumbnailUrl:
          "/models/kenney_furniture-kit/thumbnails/loungeChair_SE.png",
      },
      {
        id: "furn-sofa-1",
        name: "Nouveau Fabric Sofa",
        modelUrl: "/models/kenney_furniture-kit/models/loungeSofa.glb",
        color: "#2C2621",
        thumbnailUrl:
          "/models/kenney_furniture-kit/thumbnails/loungeSofa_SE.png",
      },
      {
        id: "furn-armchair-1",
        name: "Modern Leather Armchair",
        modelUrl: "/models/kenney_furniture-kit/models/loungeChairRelax.glb",
        color: "#4E3629",
        thumbnailUrl:
          "/models/kenney_furniture-kit/thumbnails/loungeChairRelax_SE.png",
      },
      {
        id: "furn-bench-1",
        name: "Minimalist Wood Bench",
        modelUrl: "/models/kenney_furniture-kit/models/bench.glb",
        color: "#A0522D",
        thumbnailUrl: "/models/kenney_furniture-kit/thumbnails/bench_SE.png",
      },
      {
        id: "furn-office-1",
        name: "Office Ergonomic Chair",
        modelUrl: "/models/kenney_furniture-kit/models/chairDesk.glb",
        color: "#1F2937",
        thumbnailUrl:
          "/models/kenney_furniture-kit/thumbnails/chairDesk_SE.png",
      },
    ],
  },
  {
    category: "Tables & Desks",
    items: [
      {
        id: "furn-dining-1",
        name: "Walnut Dining Block",
        modelUrl: "/models/kenney_furniture-kit/models/table.glb",
        color: "#5A4A3A",
        thumbnailUrl: "/models/kenney_furniture-kit/thumbnails/table_SE.png",
      },
      {
        id: "furn-desk-1",
        name: "Oak Office Desk",
        modelUrl: "/models/kenney_furniture-kit/models/desk.glb",
        color: "#B58A63",
        thumbnailUrl: "/models/kenney_furniture-kit/thumbnails/desk_SE.png",
      },
      {
        id: "furn-coffee-1",
        name: "Glass Coffee Table",
        modelUrl: "/models/kenney_furniture-kit/models/tableCoffeeGlass.glb",
        color: "#E5E7EB",
        thumbnailUrl:
          "/models/kenney_furniture-kit/thumbnails/tableCoffeeGlass_SE.png",
      },
      {
        id: "furn-round-1",
        name: "Bistro Table Round",
        modelUrl: "/models/kenney_furniture-kit/models/tableRound.glb",
        color: "#78350F",
        thumbnailUrl:
          "/models/kenney_furniture-kit/thumbnails/tableRound_SE.png",
      },
    ],
  },
  {
    category: "Storage",
    items: [
      {
        id: "furn-sideboard-1",
        name: "Slated Oak Sideboard",
        modelUrl: "/models/kenney_furniture-kit/models/cabinetBedDrawer.glb",
        color: "#A88E75",
        thumbnailUrl:
          "/models/kenney_furniture-kit/thumbnails/cabinetBedDrawer_SE.png",
      },
      {
        id: "furn-bookcase-1",
        name: "Modern Bookcase",
        modelUrl: "/models/kenney_furniture-kit/models/bookcaseClosed.glb",
        color: "#783D19",
        thumbnailUrl:
          "/models/kenney_furniture-kit/thumbnails/bookcaseClosed_SE.png",
      },
      {
        id: "furn-wardrobe-1",
        name: "Wardrobe Cabinet",
        modelUrl: "/models/kenney_furniture-kit/models/cabinetTelevision.glb",
        color: "#5C4033",
        thumbnailUrl:
          "/models/kenney_furniture-kit/thumbnails/cabinetTelevision_SE.png",
      },
    ],
  },
  {
    category: "Rugs & Carpets",
    items: [
      {
        id: "furn-rug-rect",
        name: "Nordic Geometric Area Rug",
        modelUrl: "/models/kenney_furniture-kit/models/rugRectangle.glb",
        color: "#6366F1",
        thumbnailUrl:
          "/models/kenney_furniture-kit/thumbnails/rugRectangle_SE.png",
        attachmentType: "floor" as const,
      },
      {
        id: "furn-rug-round",
        name: "Round Braided Jute Rug",
        modelUrl: "/models/kenney_furniture-kit/models/rugRound.glb",
        color: "#D97706",
        thumbnailUrl: "/models/kenney_furniture-kit/thumbnails/rugRound_SE.png",
        attachmentType: "floor" as const,
      },
      {
        id: "furn-rug-rounded",
        name: "Persian Living Rug",
        modelUrl: "/models/kenney_furniture-kit/models/rugRounded.glb",
        color: "#DC2626",
        thumbnailUrl:
          "/models/kenney_furniture-kit/thumbnails/rugRounded_SE.png",
        attachmentType: "floor" as const,
      },
      {
        id: "furn-rug-square",
        name: "Square Bedroom Carpet",
        modelUrl: "/models/kenney_furniture-kit/models/rugSquare.glb",
        color: "#4B5563",
        thumbnailUrl:
          "/models/kenney_furniture-kit/thumbnails/rugSquare_SE.png",
        attachmentType: "floor" as const,
      },
      {
        id: "furn-rug-mat",
        name: "Natural Coir Entry Mat",
        modelUrl: "/models/kenney_furniture-kit/models/rugDoormat.glb",
        color: "#92400E",
        thumbnailUrl:
          "/models/kenney_furniture-kit/thumbnails/rugDoormat_SE.png",
        attachmentType: "floor" as const,
      },
    ],
  },
  {
    category: "Ceiling & Lighting",
    items: [
      {
        id: "furn-lamp-ceiling",
        name: "Square Ceiling Chandelier",
        modelUrl: "/models/kenney_furniture-kit/models/lampSquareCeiling.glb",
        color: "#F59E0B",
        thumbnailUrl:
          "/models/kenney_furniture-kit/thumbnails/lampSquareCeiling_SE.png",
        attachmentType: "ceiling" as const,
      },
      {
        id: "furn-lamp-wall",
        name: "Architectural Sconce Light",
        modelUrl: "/models/kenney_furniture-kit/models/lampWall.glb",
        color: "#D4AF37",
        thumbnailUrl: "/models/kenney_furniture-kit/thumbnails/lampWall_SE.png",
        attachmentType: "wall" as const,
      },
      {
        id: "furn-lamp-floor",
        name: "Brushed Dome Floor Lamp",
        modelUrl: "/models/kenney_furniture-kit/models/lampRoundFloor.glb",
        color: "#10B981",
        thumbnailUrl:
          "/models/kenney_furniture-kit/thumbnails/lampRoundFloor_SE.png",
        attachmentType: "surface" as const,
      },
      {
        id: "furn-lamp-table",
        name: "Nordic Ceramic Table Lamp",
        modelUrl: "/models/kenney_furniture-kit/models/lampRoundTable.glb",
        color: "#3B82F6",
        thumbnailUrl:
          "/models/kenney_furniture-kit/thumbnails/lampRoundTable_SE.png",
        attachmentType: "surface" as const,
      },
    ],
  },
  {
    category: "Lighting & Decor",
    items: [
      {
        id: "furn-pendant-1",
        name: "Brushed Dome Pendant",
        modelUrl: "/models/kenney_furniture-kit/models/lampSquareFloor.glb",
        color: "#C2A585",
        thumbnailUrl:
          "/models/kenney_furniture-kit/thumbnails/lampSquareFloor_SE.png",
        attachmentType: "surface" as const,
      },
      {
        id: "furn-plant-1",
        name: "Monstera Floor Plant",
        modelUrl: "/models/kenney_furniture-kit/models/pottedPlant.glb",
        color: "#10B981",
        thumbnailUrl:
          "/models/kenney_furniture-kit/thumbnails/pottedPlant_SE.png",
        attachmentType: "floor" as const,
      },
      {
        id: "furn-vase-1",
        name: "Retro Table Radio",
        modelUrl: "/models/kenney_furniture-kit/models/radio.glb",
        color: "#D1D5DB",
        thumbnailUrl: "/models/kenney_furniture-kit/thumbnails/radio_SE.png",
        attachmentType: "surface" as const,
      },
    ],
  },
];

export default function CatalogPanel() {
  const findModel = useModelRequest();
  const {
    tool,
    setTool,
    floorPlanLayout,
    setFloorPlan,
    addSceneObject,
    favoriteModelIds,
    toggleFavoriteModel,
    userGeneratedAssets,
    addUserGeneratedAsset,
    storeys,
    activeStoreyId,
  } = useEditorStore(
    useShallow((s) => ({
      tool: s.tool,
      setTool: s.setTool,
      floorPlanLayout: s.floorPlanLayout,
      setFloorPlan: s.setFloorPlan,
      addSceneObject: s.addSceneObject,
      favoriteModelIds: s.favoriteModelIds,
      toggleFavoriteModel: s.toggleFavoriteModel,
      userGeneratedAssets: s.userGeneratedAssets,
      addUserGeneratedAsset: s.addUserGeneratedAsset,
      storeys: s.storeys,
      activeStoreyId: s.activeStoreyId,
    })),
  );

  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiStatus, setAiStatus] = useState("");

  const handleAddSquareRoom = () => {
    if (!floorPlanLayout) {
      toast.error("Please initialize or select a project first.");
      return;
    }

    const roomId = `room-${nanoid()}`;
    const w = 12; // 12 feet wide
    const h = 12; // 12 feet long
    const x = -6; // center offsets
    const y = -6;

    const newRoom = {
      id: roomId,
      type: "living" as const,
      label: "Living Room",
      bounds: { x, y, width: w, height: h },
      area: w * h,
      color: "#2a2e35",
      ceilingHeight: 2.7, // 2.7 meters standard
    };

    const wall1 = {
      id: `wall-${nanoid()}`,
      start: { x, y },
      end: { x: x + w, y },
      thickness: 5,
      height: 9,
      isLoadBearing: false,
    };
    const wall2 = {
      id: `wall-${nanoid()}`,
      start: { x: x + w, y },
      end: { x: x + w, y: y + h },
      thickness: 5,
      height: 9,
      isLoadBearing: false,
    };
    const wall3 = {
      id: `wall-${nanoid()}`,
      start: { x: x + w, y: y + h },
      end: { x, y: y + h },
      thickness: 5,
      height: 9,
      isLoadBearing: false,
    };
    const wall4 = {
      id: `wall-${nanoid()}`,
      start: { x, y: y + h },
      end: { x, y },
      thickness: 5,
      height: 9,
      isLoadBearing: false,
    };

    setFloorPlan({
      ...floorPlanLayout,
      rooms: [...floorPlanLayout.rooms, newRoom],
      walls: [...floorPlanLayout.walls, wall1, wall2, wall3, wall4],
    });

    toast.success("Placed a 12' × 12' Square Room!");
  };

  const handleAddRectRoom = () => {
    if (!floorPlanLayout) {
      toast.error("Please initialize or select a project first.");
      return;
    }

    const roomId = `room-${nanoid()}`;
    const w = 16; // 16 feet wide
    const h = 10; // 10 feet long
    const x = -8; // center offsets
    const y = -5;

    const newRoom = {
      id: roomId,
      type: "living" as const,
      label: "Rectangular Room",
      bounds: { x, y, width: w, height: h },
      area: w * h,
      color: "#2a2e35",
      ceilingHeight: 2.7,
    };

    const wall1 = {
      id: `wall-${nanoid()}`,
      start: { x, y },
      end: { x: x + w, y },
      thickness: 5,
      height: 9,
      isLoadBearing: false,
    };
    const wall2 = {
      id: `wall-${nanoid()}`,
      start: { x: x + w, y },
      end: { x: x + w, y: y + h },
      thickness: 5,
      height: 9,
      isLoadBearing: false,
    };
    const wall3 = {
      id: `wall-${nanoid()}`,
      start: { x: x + w, y: y + h },
      end: { x, y: y + h },
      thickness: 5,
      height: 9,
      isLoadBearing: false,
    };
    const wall4 = {
      id: `wall-${nanoid()}`,
      start: { x, y: y + h },
      end: { x, y },
      thickness: 5,
      height: 9,
      isLoadBearing: false,
    };

    setFloorPlan({
      ...floorPlanLayout,
      rooms: [...floorPlanLayout.rooms, newRoom],
      walls: [...floorPlanLayout.walls, wall1, wall2, wall3, wall4],
    });

    toast.success("Placed a 16' × 10' Rectangular Room!");
  };

  const handleAddLShapeRoom = () => {
    if (!floorPlanLayout) {
      toast.error("Please initialize or select a project first.");
      return;
    }

    const roomId = `room-${nanoid()}`;
    const w = 14;
    const h = 14;
    const x = -7;
    const y = -7;

    const newRoom = {
      id: roomId,
      type: "living" as const,
      label: "L-Shaped Room",
      bounds: { x, y, width: w, height: h },
      area: w * h - 36, // minus corner cutout area
      color: "#2a2e35",
      ceilingHeight: 2.7,
    };

    const wall1 = {
      id: `wall-${nanoid()}`,
      start: { x: -7, y: -7 },
      end: { x: 1, y: -7 },
      thickness: 5,
      height: 9,
      isLoadBearing: false,
    };
    const wall2 = {
      id: `wall-${nanoid()}`,
      start: { x: 1, y: -7 },
      end: { x: 1, y: -1 },
      thickness: 5,
      height: 9,
      isLoadBearing: false,
    };
    const wall3 = {
      id: `wall-${nanoid()}`,
      start: { x: 1, y: -1 },
      end: { x: 7, y: -1 },
      thickness: 5,
      height: 9,
      isLoadBearing: false,
    };
    const wall4 = {
      id: `wall-${nanoid()}`,
      start: { x: 7, y: -1 },
      end: { x: 7, y: 7 },
      thickness: 5,
      height: 9,
      isLoadBearing: false,
    };
    const wall5 = {
      id: `wall-${nanoid()}`,
      start: { x: 7, y: 7 },
      end: { x: -7, y: 7 },
      thickness: 5,
      height: 9,
      isLoadBearing: false,
    };
    const wall6 = {
      id: `wall-${nanoid()}`,
      start: { x: -7, y: 7 },
      end: { x: -7, y: -7 },
      thickness: 5,
      height: 9,
      isLoadBearing: false,
    };

    setFloorPlan({
      ...floorPlanLayout,
      rooms: [...floorPlanLayout.rooms, newRoom],
      walls: [
        ...floorPlanLayout.walls,
        wall1,
        wall2,
        wall3,
        wall4,
        wall5,
        wall6,
      ],
    });

    toast.success("Placed an L-Shaped Room with 6 boundary walls!");
  };

  const handleAddRotatedLShapeRoom = () => {
    if (!floorPlanLayout) {
      toast.error("Please initialize or select a project first.");
      return;
    }

    const roomId = `room-${nanoid()}`;
    const w = 14;
    const h = 14;
    const x = -7;
    const y = -7;

    const newRoom = {
      id: roomId,
      type: "living" as const,
      label: "Inverted L Room",
      bounds: { x, y, width: w, height: h },
      area: w * h - 36,
      color: "#2a2e35",
      ceilingHeight: 2.7,
    };

    const wall1 = {
      id: `wall-${nanoid()}`,
      start: { x: -7, y: -7 },
      end: { x: 7, y: -7 },
      thickness: 5,
      height: 9,
      isLoadBearing: false,
    };
    const wall2 = {
      id: `wall-${nanoid()}`,
      start: { x: 7, y: -7 },
      end: { x: 7, y: 1 },
      thickness: 5,
      height: 9,
      isLoadBearing: false,
    };
    const wall3 = {
      id: `wall-${nanoid()}`,
      start: { x: 7, y: 1 },
      end: { x: 1, y: 1 },
      thickness: 5,
      height: 9,
      isLoadBearing: false,
    };
    const wall4 = {
      id: `wall-${nanoid()}`,
      start: { x: 1, y: 1 },
      end: { x: 1, y: 7 },
      thickness: 5,
      height: 9,
      isLoadBearing: false,
    };
    const wall5 = {
      id: `wall-${nanoid()}`,
      start: { x: 1, y: 7 },
      end: { x: -7, y: 7 },
      thickness: 5,
      height: 9,
      isLoadBearing: false,
    };
    const wall6 = {
      id: `wall-${nanoid()}`,
      start: { x: -7, y: 7 },
      end: { x: -7, y: -7 },
      thickness: 5,
      height: 9,
      isLoadBearing: false,
    };

    setFloorPlan({
      ...floorPlanLayout,
      rooms: [...floorPlanLayout.rooms, newRoom],
      walls: [
        ...floorPlanLayout.walls,
        wall1,
        wall2,
        wall3,
        wall4,
        wall5,
        wall6,
      ],
    });

    toast.success("Placed Inverted L-Shaped Room with 6 boundary walls!");
  };

  const handlePlaceFurniture = (item: {
    name: string;
    modelUrl: string;
    color: string;
    thumbnailUrl?: string;
    attachmentType?: "floor" | "ceiling" | "surface" | "wall";
  }) => {
    const room = floorPlanLayout?.rooms.find(r => r.type === "living") || floorPlanLayout?.rooms[0];
    const x = room ? (room.bounds.x + room.bounds.width / 2) * 0.3048 : 0;
    const z = room ? (room.bounds.y + room.bounds.height / 2) * 0.3048 : 0;

    // Altitude calculation based on attachment type:
    // 1. "floor" (carpets/rugs): sits right above floor slab at 0.005m (prevents z-fighting with floor)
    // 2. "ceiling" (chandeliers, downlights): attached to ceiling height (2.74m)
    // 3. "wall" (sconces): at eye level on wall (1.7m)
    // 4. "surface" (table lamps): on furniture surface (0.75m)
    // 5. default (seating/tables): floor level 0.0m
    let yPos = 0.0;
    const activeStorey = storeys.find((s) => s.id === activeStoreyId);
    const heightM = activeStorey?.height
      ? feetToMeters(activeStorey.height)
      : 2.74;

    if (item.attachmentType === "floor") {
      yPos = 0.005;
    } else if (item.attachmentType === "ceiling") {
      yPos = heightM;
    } else if (item.attachmentType === "wall") {
      yPos = 1.7;
    } else if (item.attachmentType === "surface") {
      yPos = 0.75;
    } else {
      yPos = 0.0;
    }

    const newObj: SceneObject = {
      id: `furniture-${nanoid()}`,
      type:
        item.attachmentType === "ceiling" || item.attachmentType === "wall"
          ? "light"
          : "furniture",
      name: item.name,
      position: { x, y: yPos, z },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      gltfPath: item.modelUrl,
      thumbnailUrl: item.thumbnailUrl,
      attachmentType: item.attachmentType || "floor",
      storeyId: activeStoreyId,
    };

    addSceneObject(newObj);
    useEditorStore.getState().setSelectedObject(newObj.id);
    toast.success(
      `Placed ${item.name} (${item.attachmentType || "floor"}) in scene!`,
    );
  };

  const handleGenerateAIAsset = async () => {
    if (!aiPrompt.trim()) return;

    setAiLoading(true);
    setAiStatus("Finding a model…");
    try {
      const result = await findModel({ prompt: aiPrompt }, setAiStatus);
      const name = result.fallback ? `Catalog sample: ${aiPrompt}` : aiPrompt;
      const asset = {
        id: `model-${nanoid()}`,
        name,
        modelUrl: result.output,
        color: "#a4866a",
      };
      addUserGeneratedAsset(asset);
      handlePlaceFurniture(asset);
      toast.success(
        result.fallback
          ? "Catalog sample added. No original model was generated."
          : "Generated model added.",
      );
      setAiPrompt("");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "No model was added.",
      );
    } finally {
      setAiLoading(false);
    }
  };

  const handleImportLocalAsset = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext !== "glb" && ext !== "gltf") {
      toast.error("Unsupported format. Please upload a .glb or .gltf file.");
      return;
    }

    // Convert local file into Object URL for runtime loading
    const url = URL.createObjectURL(file);
    const importedAsset = {
      id: `imported-model-${nanoid()}`,
      name: file.name.replace(/\.[^/.]+$/, ""), // remove extension
      modelUrl: url,
      color: "#10B981", // emerald green accent for imported assets
    };

    // 1. Add to creations library list
    addUserGeneratedAsset(importedAsset);

    // 2. Drop instantly in 3D canvas
    handlePlaceFurniture(importedAsset);

    toast.success(`Successfully imported local model "${importedAsset.name}"!`);
  };

  // Filter favorited models dynamically from the store
  const allFurnitureItems = FURNITURE_CATALOG.flatMap((cat) => cat.items);
  const favoriteItems = [
    ...allFurnitureItems.filter((item) => favoriteModelIds.includes(item.id)),
    ...userGeneratedAssets.filter((item) => favoriteModelIds.includes(item.id)),
  ];
  const [selectedCategory, setSelectedCategory] = useState<
    "rooms" | "structural" | "furnishings" | "ai-studio" | "favorites" | null
  >("furnishings");

  const isOpen = useEditorStore((state) => state.catalogOpen);
  const closeCatalog = useEditorStore((state) => state.setCatalogOpen);

  if (!isOpen) return null;
  return (
    <aside className="editor-catalog-panel" aria-label="Catalog">
      <header>
        <h2>Add to your plan</h2>
        <button
          type="button"
          aria-label="Close catalog"
          onClick={() => closeCatalog(false)}
        >
          Close
        </button>
      </header>
      <nav aria-label="Catalog categories" className="editor-catalog-tabs">
        {(
          [
            ["structural", "Build"],
            ["rooms", "Rooms"],
            ["furnishings", "Furniture"],
            ["ai-studio", "Models"],
            ["favorites", "Saved"],
          ] as const
        ).map(([id, label]) => (
          <button
            type="button"
            key={id}
            title={id === "ai-studio" ? "Model library and imports" : label}
            aria-pressed={selectedCategory === id}
            onClick={() => setSelectedCategory(id)}
          >
            {label}
          </button>
        ))}
      </nav>
      <div className="editor-catalog-content">
        {/* Dynamic Scrollable Body Content */}
        <div className="flex-1 p-5 overflow-y-auto custom-scrollbar space-y-5">
          {/* CONTENT: ROOMS */}
          {selectedCategory === "rooms" && (
            <div className="space-y-4">
              <p className="font-body text-[10px] text-stone leading-relaxed">
                Select a pre-configured template layout to instantly drop
                dynamic, editable architectural bounds into your drafting
                project.
              </p>
              <div className="grid grid-cols-2 gap-3.5">
                <button
                  onClick={handleAddSquareRoom}
                  className="p-3 border border-hairline rounded-xl flex flex-col items-center justify-center gap-2 transition-all outline-none bg-white hover:bg-gray-50 text-stone hover:text-charcoal hover:border-indigo shadow-sm cursor-pointer"
                >
                  <div className="w-12 h-12 bg-alabaster border border-hairline rounded-lg flex items-center justify-center">
                    <Square size={20} className="text-stone" />
                  </div>
                  <span className="font-body text-[10px] font-bold text-center">
                    Square Room
                  </span>
                </button>

                <button
                  onClick={handleAddRectRoom}
                  className="p-3 border border-hairline rounded-xl flex flex-col items-center justify-center gap-2 transition-all outline-none bg-white hover:bg-gray-50 text-stone hover:text-charcoal hover:border-indigo shadow-sm cursor-pointer"
                >
                  <div className="w-12 h-12 bg-alabaster border border-hairline rounded-lg flex items-center justify-center">
                    <svg
                      width="22"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-stone"
                    >
                      <rect x="3" y="5" width="18" height="14" rx="2" />
                    </svg>
                  </div>
                  <span className="font-body text-[10px] font-bold text-center">
                    Rectangular
                  </span>
                </button>

                <button
                  onClick={handleAddLShapeRoom}
                  className="p-3 border border-hairline rounded-xl flex flex-col items-center justify-center gap-2 transition-all outline-none bg-white hover:bg-gray-50 text-stone hover:text-charcoal hover:border-indigo shadow-sm cursor-pointer"
                >
                  <div className="w-12 h-12 bg-alabaster border border-hairline rounded-lg flex items-center justify-center">
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-stone"
                    >
                      <path d="M4 4h16v8H12v8H4z" />
                    </svg>
                  </div>
                  <span className="font-body text-[10px] font-bold text-center">
                    L-Shape
                  </span>
                </button>

                <button
                  onClick={handleAddRotatedLShapeRoom}
                  className="p-3 border border-hairline rounded-xl flex flex-col items-center justify-center gap-2 transition-all outline-none bg-white hover:bg-gray-50 text-stone hover:text-charcoal hover:border-indigo shadow-sm cursor-pointer"
                >
                  <div className="w-12 h-12 bg-alabaster border border-hairline rounded-lg flex items-center justify-center">
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-stone"
                    >
                      <path d="M4 4h16v16H12V12H4z" />
                    </svg>
                  </div>
                  <span className="font-body text-[10px] font-bold text-center">
                    Inverted L
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* CONTENT: STRUCTURAL */}
          {selectedCategory === "structural" && (
            <div className="space-y-4">
              <p className="font-body text-[10px] text-stone leading-relaxed">
                Select a structural CAD tool to draw walls or place openings
                (doors and windows) procedurally along your blueprints.
              </p>
              <div className="flex flex-col gap-2.5">
                <button
                  onClick={() => setTool("draw-wall")}
                  className={`p-3 border rounded-xl flex items-center gap-3 transition-all outline-none cursor-pointer ${tool === "draw-wall" ? "bg-indigo-light border-indigo text-indigo shadow-sm" : "bg-white border-hairline hover:bg-gray-50 text-stone hover:text-charcoal"}`}
                >
                  <div className="w-8 h-8 rounded-lg bg-alabaster border border-hairline flex items-center justify-center">
                    <Scissors
                      size={14}
                      className={
                        tool === "draw-wall" ? "text-indigo" : "text-stone"
                      }
                    />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="font-body text-xs font-bold">
                      Draw Wall
                    </span>
                    <span className="font-mono text-[9px] opacity-70">
                      Shortcut: W
                    </span>
                  </div>
                </button>

                <button
                  onClick={() => setTool("add-window")}
                  className={`p-3 border rounded-xl flex items-center gap-3 transition-all outline-none cursor-pointer ${tool === "add-window" ? "bg-indigo-light border-indigo text-indigo shadow-sm" : "bg-white border-hairline hover:bg-gray-50 text-stone hover:text-charcoal"}`}
                >
                  <div className="w-8 h-8 rounded-lg bg-alabaster border border-hairline flex items-center justify-center">
                    <Compass
                      size={14}
                      className={
                        tool === "add-window" ? "text-indigo" : "text-stone"
                      }
                    />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="font-body text-xs font-bold">
                      Add Window
                    </span>
                    <span className="font-mono text-[9px] opacity-70">
                      Click on any wall
                    </span>
                  </div>
                </button>

                <button
                  onClick={() => setTool("add-door")}
                  className={`p-3 border rounded-xl flex items-center gap-3 transition-all outline-none cursor-pointer ${tool === "add-door" ? "bg-indigo-light border-indigo text-indigo shadow-sm" : "bg-white border-hairline hover:bg-gray-50 text-stone hover:text-charcoal"}`}
                >
                  <div className="w-8 h-8 rounded-lg bg-alabaster border border-hairline flex items-center justify-center">
                    <Plus
                      size={14}
                      className={
                        tool === "add-door" ? "text-indigo" : "text-stone"
                      }
                    />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="font-body text-xs font-bold">
                      Add Door
                    </span>
                    <span className="font-mono text-[9px] opacity-70">
                      Click on any wall
                    </span>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* CONTENT: FURNISHINGS */}
          {selectedCategory === "furnishings" && (
            <div className="space-y-4">
              {FURNITURE_CATALOG.map((cat, idx) => (
                <div key={idx} className="space-y-2">
                  <h4 className="font-jakarta text-[9px] font-extrabold text-stone uppercase tracking-wider pl-1">
                    {cat.category}
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {cat.items.map((item, itemIdx) => (
                      <div
                        key={itemIdx}
                        className="p-2 border border-hairline rounded-xl flex flex-col items-start text-left gap-1.5 transition-all outline-none bg-white hover:bg-gray-50 hover:border-indigo group relative cursor-pointer"
                      >
                        <button
                          type="button"
                          className="catalog-place-button"
                          onClick={() => handlePlaceFurniture(item)}
                        >
                          <div className="w-full h-16 rounded-lg bg-alabaster flex items-center justify-center relative overflow-hidden border border-hairline">
                            {item.thumbnailUrl ? (
                              <Image
                                src={item.thumbnailUrl}
                                alt={item.name}
                                fill
                                className="object-contain p-2"
                                unoptimized
                              />
                            ) : (
                              <Armchair
                                size={24}
                                className="text-stone opacity-60"
                              />
                            )}
                            <span
                              className="absolute top-1.5 left-1.5 w-3 h-3 rounded-full border border-white/20 shadow-sm"
                              style={{ backgroundColor: item.color }}
                            />
                          </div>
                          <span className="font-body text-[11px] font-medium text-charcoal line-clamp-2">
                            {item.name}
                          </span>
                        </button>
                        <button
                          type="button"
                          aria-label={`Toggle favorite: ${item.name}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavoriteModel(item.id);
                            if (favoriteModelIds.includes(item.id)) {
                              toast.success(
                                `Removed ${item.name} from Favorites.`,
                              );
                            } else {
                              toast.success(`Added ${item.name} to Favorites!`);
                            }
                          }}
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-white border border-hairline flex items-center justify-center shadow-sm hover:scale-110 transition-transform outline-none cursor-pointer"
                        >
                          <Heart
                            size={10}
                            fill={
                              favoriteModelIds.includes(item.id)
                                ? "#ef4444"
                                : "transparent"
                            }
                            stroke={
                              favoriteModelIds.includes(item.id)
                                ? "#ef4444"
                                : "#a1a1aa"
                            }
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* CONTENT: AI STUDIO */}
          {selectedCategory === "ai-studio" && (
            <div className="space-y-4">
              {/* Neural Synthesis */}
              <div className="space-y-3">
                <p className="font-body text-[10px] text-stone leading-relaxed">
                  Find a built-in model by name, or import a GLB file. Use the
                  Furniture studio for optional image-to-3D generation.
                </p>

                <textarea
                  aria-label="Find a catalog model"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  disabled={aiLoading}
                  placeholder="e.g. Mid-century modern oak sideboard with slatted doors..."
                  className="w-full h-16 p-2.5 text-xs border border-hairline rounded-xl bg-white resize-none outline-none font-body placeholder:text-muted focus:border-indigo transition-colors"
                />

                {aiLoading ? (
                  <div className="flex flex-col gap-2 p-3 bg-alabaster border border-hairline border-dashed rounded-xl items-center text-center">
                    <Loader2 className="w-5 h-5 text-indigo animate-spin" />
                    <span className="font-body text-[9px] text-stone font-bold uppercase tracking-wider animate-pulse">
                      {aiStatus}
                    </span>
                  </div>
                ) : (
                  <button
                    onClick={handleGenerateAIAsset}
                    disabled={!aiPrompt.trim()}
                    className="w-full h-10 bg-indigo hover:bg-indigoDark text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-button disabled:opacity-50 transition-colors outline-none cursor-pointer"
                  >
                    <span>Find catalog model</span>
                  </button>
                )}
              </div>

              {/* Custom 3D Model Importer (GLTF/GLB Upload) */}
              <div className="border-t border-hairline/60 pt-3.5 space-y-2">
                <h4 className="font-jakarta text-[9px] font-extrabold text-stone uppercase tracking-wider pl-1 flex items-center gap-1">
                  <FolderOpen size={11} className="text-teal" />
                  <span>Import Local 3D Model</span>
                </h4>
                <p className="font-body text-[9px] text-stone leading-relaxed pl-1">
                  Upload your own `.glb` or `.gltf` model to load it instantly
                  as an interactive physical asset.
                </p>
                <label className="w-full h-10 border border-hairline border-dashed rounded-xl bg-white hover:bg-gray-50 hover:border-teal transition-all flex items-center justify-center gap-1.5 cursor-pointer text-xs font-bold text-stone hover:text-charcoal select-none">
                  <Upload size={13} className="text-teal animate-bounce" />
                  <span>Choose GLB / GLTF file</span>
                  <input
                    type="file"
                    accept=".glb,.gltf"
                    onChange={handleImportLocalAsset}
                    className="hidden"
                  />
                </label>
              </div>

              {/* User Custom creations library sub-catalog */}
              {userGeneratedAssets.length > 0 && (
                <div className="space-y-2 border-t border-hairline pt-3.5 animate-in fade-in duration-200">
                  <h4 className="font-jakarta text-[9px] font-extrabold text-stone uppercase tracking-wider pl-1 flex items-center gap-1">
                    <span>Saved models</span>
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {userGeneratedAssets.map((item) => (
                      <div
                        key={item.id}
                        className="p-2 border border-hairline rounded-xl flex flex-col items-start text-left gap-1.5 transition-all outline-none bg-white hover:bg-gray-50 hover:border-indigo group relative cursor-pointer"
                      >
                        <button
                          type="button"
                          className="catalog-place-button"
                          onClick={() => handlePlaceFurniture(item)}
                        >
                          <div className="w-full h-16 rounded-lg bg-alabaster flex items-center justify-center relative overflow-hidden border border-hairline">
                            {item.thumbnailUrl ? (
                              <Image
                                src={item.thumbnailUrl}
                                alt={item.name}
                                fill
                                className="object-contain p-2"
                                unoptimized
                              />
                            ) : (
                              <Armchair
                                size={24}
                                className="text-stone opacity-60"
                              />
                            )}
                            <span
                              className="absolute top-1.5 left-1.5 w-3 h-3 rounded-full border border-white/20 shadow-sm"
                              style={{ backgroundColor: item.color }}
                            />
                          </div>
                          <span className="font-body text-[11px] font-medium text-charcoal line-clamp-2">
                            {item.name}
                          </span>
                        </button>
                        <button
                          type="button"
                          aria-label={`Toggle favorite: ${item.name}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavoriteModel(item.id);
                            if (favoriteModelIds.includes(item.id)) {
                              toast.success(
                                `Removed ${item.name} from Favorites.`,
                              );
                            } else {
                              toast.success(`Added ${item.name} to Favorites!`);
                            }
                          }}
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-white border border-hairline flex items-center justify-center shadow-sm hover:scale-110 transition-transform outline-none cursor-pointer"
                        >
                          <Heart
                            size={10}
                            fill={
                              favoriteModelIds.includes(item.id)
                                ? "#ef4444"
                                : "transparent"
                            }
                            stroke={
                              favoriteModelIds.includes(item.id)
                                ? "#ef4444"
                                : "#a1a1aa"
                            }
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* CONTENT: FAVORITES */}
          {selectedCategory === "favorites" && (
            <div className="space-y-4">
              {favoriteItems.length === 0 ? (
                <div className="text-center py-6 px-3 bg-alabaster border border-hairline border-dashed rounded-xl text-stone flex flex-col items-center justify-center gap-2">
                  <Heart size={16} className="text-stone/50 animate-pulse" />
                  <div className="space-y-0.5">
                    <span className="font-body text-[10px] font-bold block uppercase tracking-wider">
                      Empty Collection
                    </span>
                    <span className="font-body text-[9px] text-stone leading-relaxed block">
                      Click the heart icon on catalog models to build your
                      customized favorites!
                    </span>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {favoriteItems.map((item) => (
                    <div
                      key={item.id}
                      className="p-2 border border-hairline rounded-xl flex flex-col items-start text-left gap-1.5 transition-all outline-none bg-white hover:bg-gray-50 hover:border-indigo group relative cursor-pointer"
                    >
                      <button
                        type="button"
                        className="catalog-place-button"
                        onClick={() => handlePlaceFurniture(item)}
                      >
                        <div className="w-full h-16 rounded-lg bg-alabaster flex items-center justify-center relative overflow-hidden border border-hairline">
                          {item.thumbnailUrl ? (
                            <Image
                              src={item.thumbnailUrl}
                              alt={item.name}
                              fill
                              className="object-contain p-2"
                              unoptimized
                            />
                          ) : (
                            <Armchair
                              size={24}
                              className="text-stone opacity-60"
                            />
                          )}
                          <span
                            className="absolute top-1.5 left-1.5 w-3 h-3 rounded-full border border-white/20 shadow-sm"
                            style={{ backgroundColor: item.color }}
                          />
                        </div>
                        <span className="font-body text-[11px] font-medium text-charcoal line-clamp-2">
                          {item.name}
                        </span>
                      </button>
                      <button
                        type="button"
                        aria-label={`Toggle favorite: ${item.name}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavoriteModel(item.id);
                          toast.success(`Removed ${item.name} from Favorites.`);
                        }}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-white border border-hairline flex items-center justify-center text-rose shadow-sm hover:scale-110 transition-transform outline-none cursor-pointer"
                      >
                        <Heart size={10} fill="#ef4444" stroke="#ef4444" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
