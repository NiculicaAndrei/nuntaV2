import { useRef } from 'react';
import { Group, Circle, Text } from 'react-konva';
import { isPointInPolygon, TABLE_RADIUS } from '../utils/geometry';

/**
 * Reprezentarea vizuală a unei mese pe canvas.
 * - Click pe cerc -> deschide/închide popover-ul cu lista de invitați.
 * - Click pe iconița ⚙️ -> deschide modalul de editare (nume + capacitate).
 * Poziția (x, y) e controlată din state; în timpul drag-ului Konva mută
 * nodul intern fără re-render, iar la onDragEnd trimitem poziția finală
 * înapoi în state (MOVE_TABLE).
 */
function TableNode({ masa, numarInvitati, roomPoints, draggable, onSelect, onEdit, onMove }) {
  const lastValidPos = useRef({ x: masa.x, y: masa.y });
  const plina = numarInvitati >= masa.capacitate;

  const dragBoundFunc = (pos) => {
    // Fără limită desenată încă -> mișcare complet liberă.
    if (roomPoints.length < 3 || isPointInPolygon(pos, roomPoints)) {
      lastValidPos.current = pos;
      return pos;
    }
    // În afara sălii -> rămânem la ultima poziție validă (efect de "perete").
    return lastValidPos.current;
  };

  const handleEditClick = (e) => {
    e.cancelBubble = true; // nu declanșăm și click-ul de pe Group (popover-ul)
    onEdit();
  };

  const handleMouseEnter = (e) => {
    e.target.getStage().container().style.cursor = draggable ? 'grab' : 'pointer';
  };

  const handleMouseLeave = (e) => {
    e.target.getStage().container().style.cursor = 'default';
  };

  return (
    <Group
      x={masa.x}
      y={masa.y}
      draggable={draggable}
      dragBoundFunc={dragBoundFunc}
      onDragEnd={(e) => onMove(e.target.x(), e.target.y())}
      onClick={onSelect}
      onTap={onSelect}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Circle
        radius={TABLE_RADIUS}
        fill="#1e1e1e"
        stroke={plina ? '#10b981' : '#3b82f6'}
        strokeWidth={3}
        shadowColor="black"
        shadowOpacity={0.45}
        shadowBlur={12}
        shadowOffsetY={6}
      />

      <Text
        text={masa.nume}
        fontSize={14}
        fontStyle="bold"
        fill="#ffffff"
        width={TABLE_RADIUS * 2}
        x={-TABLE_RADIUS}
        y={-12}
        align="center"
        wrap="none"
        ellipsis
      />
      <Text
        text={`${numarInvitati} / ${masa.capacitate}`}
        fontSize={12}
        fill="#9ca3af"
        width={TABLE_RADIUS * 2}
        x={-TABLE_RADIUS}
        y={8}
        align="center"
      />

      {/* Iconiță separată pentru editare, ca să nu se bată cap în cap cu popover-ul de invitați */}
      <Text
        text="⚙️"
        fontSize={15}
        x={TABLE_RADIUS - 24}
        y={-TABLE_RADIUS + 2}
        onClick={handleEditClick}
        onTap={handleEditClick}
      />
    </Group>
  );
}

export default TableNode;
