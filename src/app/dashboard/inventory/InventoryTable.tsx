'use client'

import { useState, useRef, useMemo } from 'react'
import { createClient } from '@/utils/supabase/client'
import Papa from 'papaparse'
import styles from './inventory.module.css'

type Product = {
  product_code: string
  lens_width: string | null
  brands: string | null
  location: string | null
  type: string | null
  comments: string | null
  mrp: number | null
  cost_price: number | null
  sale_price_s: number | null
  sale_price_a: number | null
  stock: number
  date_added: string
}

export default function InventoryTable({ initialProducts, userRole }: { initialProducts: Product[], userRole: string }) {
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [isAdding, setIsAdding] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [newProduct, setNewProduct] = useState<Partial<Product>>({ stock: 0 })
  const [feedback, setFeedback] = useState<{ message: string, type: 'success' | 'error', persistent?: boolean } | null>(null)
  
  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [stockFilter, setStockFilter] = useState('')
  const [costPriceFilter, setCostPriceFilter] = useState('')
  const [salePriceSFilter, setSalePriceSFilter] = useState('')
  const [salePriceAFilter, setSalePriceAFilter] = useState('')
  const [mrpFilter, setMrpFilter] = useState('')
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 50

  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const showFeedback = (message: string, type: 'success' | 'error', persistent: boolean = false) => {
    setFeedback({ message, type, persistent })
    if (!persistent) {
      setTimeout(() => setFeedback(null), 5000)
    }
  }

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newProduct.product_code) return showFeedback('Product code is required', 'error')

    const { data, error } = await supabase
      .from('products')
      .upsert([newProduct], { onConflict: 'product_code' })
      .select()

    if (error) {
      showFeedback('Error saving product: ' + error.message, 'error')
    } else if (data) {
      // Update state if product exists, or add new
      setProducts(prev => {
        const exists = prev.find(p => p.product_code === data[0].product_code)
        if (exists) {
          return prev.map(p => p.product_code === data[0].product_code ? data[0] : p)
        }
        return [data[0], ...prev]
      })
      showFeedback('Product saved successfully!', 'success')
      setIsAdding(false)
      setNewProduct({ stock: 0 })
    }
  }

  const handleDeleteProduct = async (productCode: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('product_code', productCode)

    if (error) {
      if (error.message.includes('violates foreign key constraint')) {
        showFeedback('Cannot delete this product because it has recorded sales. Please void those sales in the Financial Reports tab first.', 'error')
      } else {
        showFeedback('Could not delete product. Please try again.', 'error')
      }
    } else {
      setProducts(prev => prev.filter(p => p.product_code !== productCode))
      showFeedback('Product deleted successfully', 'success')
    }
  }

  const handleEditProduct = (product: Product) => {
    setNewProduct(product)
    setIsAdding(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDownloadTemplate = () => {
    const headers = ['product_code', 'type', 'brands', 'lens_width', 'location', 'stock', 'cost_price', 'sale_price_s', 'sale_price_a', 'mrp', 'comments']
    const csvContent = headers.join(',') + '\n'
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'inventory_template.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setFeedback(null)
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data as any[]
        
        const validRows: any[] = []
        const rowErrors: string[] = []
        const duplicateSkus: string[] = []

        rows.forEach((row, index) => {
          const rowNum = index + 2 // +2 because array is 0-indexed and row 1 is header
          
          if (!row.product_code || String(row.product_code).trim() === '') {
            rowErrors.push(`Row ${rowNum}: Missing product_code`)
            return
          }

          const product_code = String(row.product_code).trim()

          const parseNumber = (val: any) => {
            if (!val || String(val).trim() === '') return null
            const num = parseFloat(val)
            return isNaN(num) ? 'INVALID' : num
          }

          const stock = parseNumber(row.stock) || 0
          const cp = parseNumber(row.cost_price)
          const sps = parseNumber(row.sale_price_s)
          const spa = parseNumber(row.sale_price_a)
          const mrp = parseNumber(row.mrp)

          if (cp === 'INVALID' || sps === 'INVALID' || spa === 'INVALID' || mrp === 'INVALID' || stock === 'INVALID') {
            rowErrors.push(`Row ${rowNum} (${product_code}): Invalid number format in pricing or stock`)
            return
          }

          validRows.push({
            ...row,
            product_code,
            stock: stock as number,
            cost_price: cp as number | null,
            sale_price_s: sps as number | null,
            sale_price_a: spa as number | null,
            mrp: mrp as number | null,
          })
        })
        
        // Deduplicate rows by product_code (keep the last occurrence in the CSV)
        const uniqueRowsMap = new Map()
        for (const row of validRows) {
          if (uniqueRowsMap.has(row.product_code)) {
            duplicateSkus.push(row.product_code)
          }
          uniqueRowsMap.set(row.product_code, row)
        }
        const uniqueValidRows = Array.from(uniqueRowsMap.values())

        if (uniqueValidRows.length === 0) {
          showFeedback('No valid products found in CSV. Make sure "product_code" column exists.', 'error')
          setIsUploading(false)
          return
        }

        const { data, error } = await supabase
          .from('products')
          .upsert(uniqueValidRows, { onConflict: 'product_code' })
          .select()

        if (error) {
          showFeedback('Error uploading CSV: ' + error.message, 'error', true)
        } else if (data) {
          let msg = `Successfully saved ${data.length} products.`
          
          if (duplicateSkus.length > 0) {
            // Remove dupes of dupes for a clean list
            const uniqueDupes = Array.from(new Set(duplicateSkus))
            msg += `\n\n🔄 ${uniqueDupes.length} duplicate SKUs were automatically merged (last row kept):\n` +
                   uniqueDupes.slice(0, 10).map(sku => `• ${sku}`).join('\n')
            if (uniqueDupes.length > 10) msg += `\n...and ${uniqueDupes.length - 10} more.`
          }

          if (rowErrors.length > 0) {
            msg += `\n\n⚠️ ${rowErrors.length} rows were skipped due to errors:\n` + 
                   rowErrors.slice(0, 10).map(e => `• ${e}`).join('\n')
            if (rowErrors.length > 10) msg += `\n...and ${rowErrors.length - 10} more.`
          }

          // If there were errors or duplicates, show as persistent so they can read the logs.
          const needsPersistence = rowErrors.length > 0 || duplicateSkus.length > 0
          showFeedback(msg, rowErrors.length > 0 ? 'error' : 'success', needsPersistence)
          
          // Merge with existing state
          const newMap = new Map(data.map(item => [item.product_code, item]))
          setProducts(prev => {
            const merged = prev.map(p => newMap.has(p.product_code) ? newMap.get(p.product_code)! : p)
            const added = data.filter(d => !prev.find(p => p.product_code === d.product_code))
            return [...added, ...merged]
          })
        }
        
        setIsUploading(false)
        if (fileInputRef.current) fileInputRef.current.value = ''
      },
      error: (error) => {
        showFeedback('Error parsing CSV: ' + error.message, 'error')
        setIsUploading(false)
      }
    })
  }

  const handleExportData = () => {
    if (products.length === 0) {
      return showFeedback('No products to export.', 'error')
    }
    
    const csvContent = Papa.unparse(products)
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'inventory_export.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Filter and Pagination Logic
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const q = searchQuery.toLowerCase()
      const matchesSearch = !q || (p.product_code?.toLowerCase().includes(q) || p.brands?.toLowerCase().includes(q))
      const matchesType = !typeFilter || p.type === typeFilter
      
      let matchesStock = true
      if (stockFilter === 'out') matchesStock = p.stock === 0
      if (stockFilter === 'in') matchesStock = p.stock > 0

      let matchesCost = true
      if (costPriceFilter === 'missing') matchesCost = p.cost_price === null || isNaN(p.cost_price)
      if (costPriceFilter === 'present') matchesCost = p.cost_price !== null && !isNaN(p.cost_price)

      let matchesSaleS = true
      if (salePriceSFilter === 'missing') matchesSaleS = p.sale_price_s === null || isNaN(p.sale_price_s)
      if (salePriceSFilter === 'present') matchesSaleS = p.sale_price_s !== null && !isNaN(p.sale_price_s)

      let matchesSaleA = true
      if (salePriceAFilter === 'missing') matchesSaleA = p.sale_price_a === null || isNaN(p.sale_price_a)
      if (salePriceAFilter === 'present') matchesSaleA = p.sale_price_a !== null && !isNaN(p.sale_price_a)

      let matchesMrp = true
      if (mrpFilter === 'missing') matchesMrp = p.mrp === null || isNaN(p.mrp)
      if (mrpFilter === 'present') matchesMrp = p.mrp !== null && !isNaN(p.mrp)

      return matchesSearch && matchesType && matchesStock && matchesCost && matchesSaleS && matchesSaleA && matchesMrp
    })
  }, [products, searchQuery, typeFilter, stockFilter, costPriceFilter, salePriceSFilter, salePriceAFilter, mrpFilter])

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage))
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const uniqueTypes = useMemo(() => {
    const types = new Set(products.map(p => p.type).filter(Boolean))
    return Array.from(types) as string[]
  }, [products])

  // Reset page when filters change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    setCurrentPage(1)
  }

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTypeFilter(e.target.value)
    setCurrentPage(1)
  }

  return (
    <div>
      {feedback && (
        <div 
          className={feedback.type === 'success' ? styles.successFeedback : styles.errorFeedback}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}
        >
          <div style={{ whiteSpace: 'pre-line', lineHeight: '1.5' }}>{feedback.message}</div>
          {feedback.persistent && (
            <button 
              onClick={() => setFeedback(null)} 
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', padding: '0 0.5rem', fontWeight: 'bold' }} 
              aria-label="Dismiss"
            >
              &times;
            </button>
          )}
        </div>
      )}

      {userRole === 'admin' && (
        <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button onClick={() => setIsAdding(!isAdding)} className={styles.primaryBtn}>
            {isAdding ? 'Cancel' : '+ Add Single Product'}
          </button>
          <button onClick={handleDownloadTemplate} className={styles.secondaryBtn}>
            Download CSV Template
          </button>
          <div>
            <input 
              type="file" 
              accept=".csv" 
              ref={fileInputRef}
              style={{ display: 'none' }} 
              onChange={handleFileUpload}
            />
            <button 
              onClick={() => fileInputRef.current?.click()} 
              className={styles.secondaryBtn}
              disabled={isUploading}
            >
              {isUploading ? 'Uploading...' : 'Bulk Upload/Update CSV'}
            </button>
          </div>
          <button onClick={handleExportData} className={styles.secondaryBtn} style={{ marginLeft: 'auto' }}>
            Export Inventory CSV
          </button>
        </div>
      )}

      {isAdding && userRole === 'admin' && (
        <form onSubmit={handleAddProduct} className={styles.addForm}>
          <h3>Add / Update Product</h3>
          <div className={styles.grid}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#4b5563' }}>Product Code (SKU) *</label>
              <input required placeholder="Product Code (SKU)" value={newProduct.product_code || ''} onChange={(e) => setNewProduct({...newProduct, product_code: e.target.value})} className={styles.input} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#4b5563' }}>Type</label>
              <input placeholder="Type (e.g. SPECTACLE GLASS)" value={newProduct.type || ''} onChange={(e) => setNewProduct({...newProduct, type: e.target.value})} className={styles.input} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#4b5563' }}>Brand</label>
              <input placeholder="Brand" value={newProduct.brands || ''} onChange={(e) => setNewProduct({...newProduct, brands: e.target.value})} className={styles.input} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#4b5563' }}>Lens Width</label>
              <input placeholder="Lens Width" value={newProduct.lens_width || ''} onChange={(e) => setNewProduct({...newProduct, lens_width: e.target.value})} className={styles.input} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#4b5563' }}>Location</label>
              <input placeholder="Location" value={newProduct.location || ''} onChange={(e) => setNewProduct({...newProduct, location: e.target.value})} className={styles.input} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#4b5563' }}>Stock</label>
              <input type="number" placeholder="Stock" value={newProduct.stock || 0} onChange={(e) => setNewProduct({...newProduct, stock: parseInt(e.target.value)})} className={styles.input} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#4b5563' }}>Cost Price</label>
              <input type="number" placeholder="Cost Price" value={newProduct.cost_price || ''} onChange={(e) => setNewProduct({...newProduct, cost_price: parseFloat(e.target.value)})} className={styles.input} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#4b5563' }}>Sale Price S (Store)</label>
              <input type="number" placeholder="Sale Price S (Store)" value={newProduct.sale_price_s || ''} onChange={(e) => setNewProduct({...newProduct, sale_price_s: parseFloat(e.target.value)})} className={styles.input} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#4b5563' }}>Sale Price A (Accounts)</label>
              <input type="number" placeholder="Sale Price A (Accounts)" value={newProduct.sale_price_a || ''} onChange={(e) => setNewProduct({...newProduct, sale_price_a: parseFloat(e.target.value)})} className={styles.input} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#4b5563' }}>MRP</label>
              <input type="number" placeholder="MRP" value={newProduct.mrp || ''} onChange={(e) => setNewProduct({...newProduct, mrp: parseFloat(e.target.value)})} className={styles.input} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', gridColumn: '1 / -1' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#4b5563' }}>Comments</label>
              <input placeholder="Comments" value={newProduct.comments || ''} onChange={(e) => setNewProduct({...newProduct, comments: e.target.value})} className={styles.input} />
            </div>
          </div>
          <button type="submit" className={styles.submitBtn}>Save Product</button>
        </form>
      )}

      {/* Search and Filters */}
      <div className={styles.filterBar}>
        <input 
          type="text" 
          placeholder="Search by SKU or Brand..." 
          value={searchQuery}
          onChange={handleSearchChange}
          className={styles.searchInput}
        />
        <select value={typeFilter} onChange={handleTypeChange} className={styles.selectInput}>
          <option value="">All Types</option>
          {uniqueTypes.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <div className={styles.resultCount}>
          Showing {filteredProducts.length} items
        </div>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>SKU</th>
              <th>Type</th>
              <th>Brand</th>
              {userRole === 'admin' && <th>Lens Width</th>}
              {userRole === 'admin' && <th>Location</th>}
              <th>
                Stock
                <select value={stockFilter} onChange={e => {setStockFilter(e.target.value); setCurrentPage(1)}} style={{ display: 'block', width: '100%', marginTop: '4px', fontSize: '0.75rem', fontWeight: 'normal', padding: '2px', cursor: 'pointer' }}>
                  <option value="">All</option>
                  <option value="out">Out of Stock</option>
                  <option value="in">In Stock</option>
                </select>
              </th>
              {userRole === 'admin' && (
                <th>
                  Cost Price
                  <select value={costPriceFilter} onChange={e => {setCostPriceFilter(e.target.value); setCurrentPage(1)}} style={{ display: 'block', width: '100%', marginTop: '4px', fontSize: '0.75rem', fontWeight: 'normal', padding: '2px', cursor: 'pointer' }}>
                    <option value="">All</option>
                    <option value="missing">Missing</option>
                    <option value="present">Present</option>
                  </select>
                </th>
              )}
              <th>
                Sale Price S
                <select value={salePriceSFilter} onChange={e => {setSalePriceSFilter(e.target.value); setCurrentPage(1)}} style={{ display: 'block', width: '100%', marginTop: '4px', fontSize: '0.75rem', fontWeight: 'normal', padding: '2px', cursor: 'pointer' }}>
                  <option value="">All</option>
                  <option value="missing">Missing</option>
                  <option value="present">Present</option>
                </select>
              </th>
              {userRole === 'admin' && (
                <th>
                  Sale Price A
                  <select value={salePriceAFilter} onChange={e => {setSalePriceAFilter(e.target.value); setCurrentPage(1)}} style={{ display: 'block', width: '100%', marginTop: '4px', fontSize: '0.75rem', fontWeight: 'normal', padding: '2px', cursor: 'pointer' }}>
                    <option value="">All</option>
                    <option value="missing">Missing</option>
                    <option value="present">Present</option>
                  </select>
                </th>
              )}
              {userRole === 'admin' && (
                <th>
                  MRP
                  <select value={mrpFilter} onChange={e => {setMrpFilter(e.target.value); setCurrentPage(1)}} style={{ display: 'block', width: '100%', marginTop: '4px', fontSize: '0.75rem', fontWeight: 'normal', padding: '2px', cursor: 'pointer' }}>
                    <option value="">All</option>
                    <option value="missing">Missing</option>
                    <option value="present">Present</option>
                  </select>
                </th>
              )}
              {userRole === 'admin' && <th>Comments</th>}
              {userRole === 'admin' && <th>Date Added</th>}
              {userRole === 'admin' && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {paginatedProducts.map((p) => (
              <tr key={p.product_code}>
                <td>{p.product_code}</td>
                <td>{p.type}</td>
                <td>{p.brands}</td>
                {userRole === 'admin' && <td>{p.lens_width}</td>}
                {userRole === 'admin' && <td>{p.location}</td>}
                <td><strong>{p.stock}</strong></td>
                {userRole === 'admin' && <td>₹{p.cost_price}</td>}
                <td>₹{p.sale_price_s}</td>
                {userRole === 'admin' && <td>₹{p.sale_price_a}</td>}
                {userRole === 'admin' && <td>₹{p.mrp}</td>}
                {userRole === 'admin' && <td>{p.comments}</td>}
                {userRole === 'admin' && <td>{p.date_added ? p.date_added.split('T')[0] : ''}</td>}
                {userRole === 'admin' && (
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <button 
                      onClick={() => handleEditProduct(p)} 
                      style={{ color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', marginRight: '0.75rem', fontWeight: 500 }}
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDeleteProduct(p.product_code)} 
                      style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}
                    >
                      Delete
                    </button>
                  </td>
                )}
              </tr>
            ))}
            {paginatedProducts.length === 0 && (
              <tr>
                <td colSpan={userRole === 'admin' ? 14 : 6} style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
                  No products found matching your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button 
            disabled={currentPage === 1} 
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            className={styles.pageBtn}
          >
            Previous
          </button>
          <span>Page {currentPage} of {totalPages}</span>
          <button 
            disabled={currentPage === totalPages} 
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            className={styles.pageBtn}
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
