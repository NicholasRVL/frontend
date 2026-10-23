const leftSlots = [154, 229, 304, 379, 454, 529];
const topSlots = [310, 465, 620, 775, 930];
const rightSlots = [265, 330, 395, 460];

export const PARKING_LAYOUT = [
  ...leftSlots.map((y, index) => ({
    code: `P${String(index + 1).padStart(2, "0")}`,
    referenceCode: `A${index + 1}`,
    x: 105,
    y,
    width: 104,
    height: 58,
    rotation: -45,
    shape: "diagonal",
  })),
  ...topSlots.map((x, index) => ({
    code: `P${String(index + 7).padStart(2, "0")}`,
    referenceCode: `B${index + 1}`,
    x,
    y: 205,
    width: 130,
    height: 60,
  })),
  ...rightSlots.map((y, index) => ({
    code: `P${String(index + 12).padStart(2, "0")}`,
    referenceCode: `C${index + 1}`,
    x: 1030,
    y,
    width: 140,
    height: 48,
  })),
  {
    code: "P16",
    referenceCode: "C6",
    x: 1102,
    y: 520,
    width: 66,
    height: 68,
  },
  { code: "P17", referenceCode: "D1", x: 600, y: 320, width: 350, height: 56 },
  { code: "P18", referenceCode: "D2", x: 600, y: 405, width: 350, height: 56 },
];

export const SLOT_POSITION_BY_CODE = new Map(
  PARKING_LAYOUT.map((position) => [position.code, position]),
);

export const PARKING_MAP_VIEWBOX = "0 0 1200 590";
