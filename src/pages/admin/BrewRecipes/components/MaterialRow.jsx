import React from 'react';
import { Trash2 } from 'lucide-react';

const MaterialRow = ({ index, selectedMaterial, materialsList, onChange, onRemove }) => {
  const handleSelectChange = (e) => {
    const rmId = e.target.value;
    const found = materialsList.find(m => m.id.toString() === rmId.toString());
    onChange(index, {
      raw_material_id: rmId,
      quantity: selectedMaterial.quantity || 0,
      unit: found ? found.unit : (selectedMaterial.unit || 'g'),
      cost_per_unit: found ? parseFloat(found.cost_per_unit || 0) : 0,
      name: found ? found.name : ''
    });
  };

  const handleQtyChange = (e) => {
    const qty = parseFloat(e.target.value) || 0;
    onChange(index, {
      ...selectedMaterial,
      quantity: qty
    });
  };

  const handleUnitChange = (e) => {
    onChange(index, {
      ...selectedMaterial,
      unit: e.target.value
    });
  };

  return (
    <div className="material-row-item">
      <div className="select-col">
        <select
          value={selectedMaterial.raw_material_id || ''}
          onChange={handleSelectChange}
          className="material-select-field"
        >
          <option value="">-- Select Material --</option>
          {materialsList.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name} ({m.category || 'Raw'}) - Cost: ₹{m.cost_per_unit}/{m.unit}
            </option>
          ))}
        </select>
      </div>

      <div className="qty-col">
        <input
          type="number"
          step="any"
          placeholder="Qty"
          value={selectedMaterial.quantity || ''}
          onChange={handleQtyChange}
          className="material-qty-field"
        />
      </div>

      <div className="unit-col">
        <select
          value={selectedMaterial.unit || 'g'}
          onChange={handleUnitChange}
          className="material-unit-field"
        >
          <option value="kg">kg</option>
          <option value="g">g</option>
          <option value="l">l</option>
          <option value="ml">ml</option>
          <option value="pcs">pcs</option>
        </select>
      </div>

      <button
        type="button"
        onClick={() => onRemove(index)}
        className="btn-remove-material"
        title="Remove Material"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
};

export default MaterialRow;
