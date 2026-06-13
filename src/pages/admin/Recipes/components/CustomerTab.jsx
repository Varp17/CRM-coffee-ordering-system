import React, { useState, useEffect, useMemo } from 'react';
import { customDrinkService } from '../../../../services/customDrinks';
import { formatCurrency } from '../../../../utils/formatters';
import { unwrapList } from '../../../../utils/apiResponse';
import toast from 'react-hot-toast';
import { DataTable } from '../../../../components/ui/DataTable';

const CustomerTab = ({ refreshKey, setLoading }) => {
  const [recipes, setRecipes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadRecipes = async () => {
    setIsLoading(true);
    if (setLoading) setLoading(true);
    try {
      const resp = await customDrinkService.list({ all: true, limit: 100 });
      setRecipes(unwrapList(resp));
    } catch (err) {
      toast.error('Failed to load customer recipes: ' + err.message);
    } finally {
      setIsLoading(false);
      if (setLoading) setLoading(false);
    }
  };

  useEffect(() => {
    loadRecipes();
  }, [refreshKey]);

  const columns = useMemo(() => [
    {
      header: 'Customer Name',
      accessor: 'customer_name',
      sortable: true,
      render: (row) => <span>{row.customer_name || 'Guest/Anonymous'}</span>
    },
    {
      header: 'Recipe Name',
      accessor: 'name',
      sortable: true,
      render: (row) => <strong style={{ color: 'var(--color-primary)' }}>{row.name}</strong>
    },
    {
      header: 'Base Beverage',
      accessor: 'base_product_name',
      sortable: true,
    },
    {
      header: 'Estimated Cost',
      accessor: 'total_price',
      sortable: true,
      render: (row) => <span>{formatCurrency(row.total_price)}</span>
    },
    {
      header: 'Order Count',
      accessor: 'order_count',
      sortable: true,
      render: (row) => <span className="badge">{row.order_count || 0} orders</span>
    },
    {
      header: 'Ingredients Customization',
      accessor: 'ingredients',
      render: (row) => {
        let ingList = [];
        try {
          ingList = typeof row.ingredients === 'string' ? JSON.parse(row.ingredients) : row.ingredients;
        } catch (_) {}
        if (!Array.isArray(ingList)) return <span>-</span>;
        return (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {ingList.map((ing, idx) => (
              <span
                key={idx}
                style={{
                  fontSize: '11px',
                  background: 'var(--color-border)',
                  color: 'var(--color-text-secondary)',
                  padding: '2px 6px',
                  borderRadius: '4px'
                }}
              >
                Qty: {ing.quantity} (ID: {ing.ingredient_id})
              </span>
            ))}
          </div>
        );
      }
    }
  ], []);

  return (
    <div className="customer-recipes-tab" style={{ marginTop: '16px' }}>
      <DataTable
        columns={columns}
        data={recipes}
        searchKey="name"
        searchPlaceholder="Search custom recipes..."
        exportFileName="customer-custom-recipes"
        isLoading={isLoading}
      />
    </div>
  );
};

export default CustomerTab;
