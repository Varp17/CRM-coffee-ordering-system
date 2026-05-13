import React, { useState } from 'react';
import './Ingredients.css';
import Button from '../../../components/Button/Button';

const Ingredients = () => {
  const [ingredients, setIngredients] = useState([
    { id: 1, name: 'Extra Espresso Shot', cost: 40, price: 60, product: 'Dark Roast' },
    { id: 2, name: 'Oat Milk', cost: 30, price: 50, product: 'All Lattes' },
    { id: 3, name: 'Vanilla Syrup', cost: 15, price: 30, product: 'Vanilla Cold Brew' },
    { id: 4, name: 'Hazelnut Flavor', cost: 15, price: 30, product: 'Hazelnut Dream' }
  ]);

  return (
    <div className="ingredients-view">
      <div className="view-header">
        <h2 className="section-title">Ingredient Mapping & Pricing</h2>
        <Button variant="primary" size="small">Add New Mapping</Button>
      </div>

      <div className="cms-table-container glass">
        <table className="cms-table">
          <thead>
            <tr>
              <th>Ingredient</th>
              <th>Applicable Product/Category</th>
              <th>Base Cost (₹)</th>
              <th>Selling Price (₹)</th>
              <th>Margin (₹)</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {ingredients.map(item => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>{item.product}</td>
                <td>₹{item.cost}</td>
                <td>₹{item.price}</td>
                <td style={{ color: '#28a745' }}>₹{item.price - item.cost}</td>
                <td>
                  <button className="action-btn edit">Edit</button>
                  <button className="action-btn delete">Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Ingredients;
