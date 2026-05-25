import { useEffect, useRef, useState } from 'react'
import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { supabase } from '../../lib/supabase'
import SettingsNav from '../../components/SettingsNav'
import type { Category, TransactionType } from '../../types'

const TYPE_LABELS: Record<TransactionType, string> = {
  expense: 'Expense Categories',
  income: 'Income Sources',
  savings: 'Savings Goals',
}

const TYPES: TransactionType[] = ['expense', 'income', 'savings']

function PencilIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  )
}

function GripIcon() {
  return (
    <svg width="12" height="16" viewBox="0 0 12 16" aria-hidden="true">
      <circle cx="3" cy="3.5" r="1.5" fill="currentColor" />
      <circle cx="9" cy="3.5" r="1.5" fill="currentColor" />
      <circle cx="3" cy="8" r="1.5" fill="currentColor" />
      <circle cx="9" cy="8" r="1.5" fill="currentColor" />
      <circle cx="3" cy="12.5" r="1.5" fill="currentColor" />
      <circle cx="9" cy="12.5" r="1.5" fill="currentColor" />
    </svg>
  )
}

interface RowProps {
  cat: Category
  isEditing: boolean
  isDeleting: boolean
  editValue: string
  editError: string | null
  editInputRef: React.RefObject<HTMLInputElement>
  onEditChange: (val: string) => void
  onSaveRename: () => void
  onCancelEdit: () => void
  onStartEdit: () => void
  onStartDelete: () => void
  onCancelDelete: () => void
  onConfirmDelete: () => void
}

function SortableRow({
  cat,
  isEditing,
  isDeleting,
  editValue,
  editError,
  editInputRef,
  onEditChange,
  onSaveRename,
  onCancelEdit,
  onStartEdit,
  onStartDelete,
  onCancelDelete,
  onConfirmDelete,
}: RowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: cat.id })

  const draggable = !isEditing && !isDeleting

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-3 px-5 py-3 min-h-[44px] ${
        isDragging ? 'opacity-50 bg-surface-alt' : ''
      }`}
    >
      <button
        {...(draggable ? { ...attributes, ...listeners } : {})}
        tabIndex={draggable ? 0 : -1}
        aria-label="Drag to reorder"
        className={`flex-shrink-0 transition-colors ${
          draggable
            ? 'cursor-grab active:cursor-grabbing text-ink-faint hover:text-ink-muted'
            : 'cursor-default text-transparent'
        }`}
      >
        <GripIcon />
      </button>

      {isEditing ? (
        <div className="flex-1 flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <input
              ref={editInputRef}
              type="text"
              value={editValue}
              onChange={(e) => onEditChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onSaveRename()
                if (e.key === 'Escape') onCancelEdit()
              }}
              className="flex-1 text-sm border border-border rounded-[8px] px-3 py-1 bg-surface text-ink focus:outline-none focus:ring-2 focus:ring-terra focus:border-transparent"
            />
            <button
              onClick={onSaveRename}
              disabled={!editValue.trim()}
              className="text-xs font-medium text-terra hover:opacity-70 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
            >
              Save
            </button>
            <button
              onClick={onCancelEdit}
              className="text-xs font-medium text-ink-faint hover:text-ink-muted transition-colors"
            >
              Cancel
            </button>
          </div>
          {editError && (
            <p className="text-xs text-red">{editError}</p>
          )}
        </div>
      ) : isDeleting ? (
        <>
          <span className="flex-1 text-sm text-ink-muted">
            Delete{' '}
            <span className="font-medium text-ink">{cat.name}</span>?
          </span>
          <button
            onClick={onConfirmDelete}
            className="text-xs font-medium text-red hover:opacity-70 transition-opacity"
          >
            Delete
          </button>
          <button
            onClick={onCancelDelete}
            className="text-xs font-medium text-ink-faint hover:text-ink-muted transition-colors"
          >
            Cancel
          </button>
        </>
      ) : (
        <>
          <span className="flex-1 text-sm text-ink">{cat.name}</span>
          <button
            onClick={onStartEdit}
            aria-label="Rename"
            className="p-1 text-ink-faint hover:text-ink transition-colors"
          >
            <PencilIcon />
          </button>
          <button
            onClick={onStartDelete}
            aria-label="Delete"
            className="p-1 text-ink-faint hover:text-red transition-colors"
          >
            <TrashIcon />
          </button>
        </>
      )}
    </li>
  )
}

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [editError, setEditError] = useState<string | null>(null)

  const [deletingId, setDeletingId] = useState<string | null>(null)

  const [addingType, setAddingType] = useState<TransactionType | null>(null)
  const [addValue, setAddValue] = useState('')
  const [addError, setAddError] = useState<string | null>(null)

  const addInputRef = useRef<HTMLInputElement>(null)
  const editInputRef = useRef<HTMLInputElement>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  useEffect(() => { fetchCategories() }, [])
  useEffect(() => { if (addingType) addInputRef.current?.focus() }, [addingType])
  useEffect(() => { if (editingId) editInputRef.current?.focus() }, [editingId])

  async function fetchCategories() {
    setLoading(true)
    setFetchError(null)
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order')
    if (error) setFetchError(error.message)
    else setCategories(data ?? [])
    setLoading(false)
  }

  function startAdd(type: TransactionType) {
    setAddingType(type)
    setAddValue('')
    setAddError(null)
    setEditingId(null)
    setDeletingId(null)
  }

  function cancelAdd() {
    setAddingType(null)
    setAddValue('')
    setAddError(null)
  }

  function startEdit(cat: Category) {
    setEditingId(cat.id)
    setEditValue(cat.name)
    setEditError(null)
    setAddingType(null)
    setDeletingId(null)
  }

  function cancelEdit() {
    setEditingId(null)
    setEditValue('')
    setEditError(null)
  }

  async function handleAdd() {
    const name = addValue.trim()
    if (!name || !addingType) return
    setAddError(null)

    const group = categories.filter((c) => c.type === addingType)
    const maxOrder = group.length > 0 ? Math.max(...group.map((c) => c.sort_order)) : 0

    const { error } = await supabase
      .from('categories')
      .insert({ type: addingType, name, sort_order: maxOrder + 1 })

    if (error) {
      setAddError(
        error.code === '23505' ? `"${name}" already exists in this group.` : error.message,
      )
      return
    }

    cancelAdd()
    await fetchCategories()
  }

  async function handleRename(id: string) {
    const name = editValue.trim()
    if (!name) return
    setEditError(null)

    const { error } = await supabase.from('categories').update({ name }).eq('id', id)

    if (error) {
      setEditError(
        error.code === '23505' ? `"${name}" already exists in this group.` : error.message,
      )
      return
    }

    cancelEdit()
    await fetchCategories()
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (error) { setFetchError(error.message); return }
    setDeletingId(null)
    await fetchCategories()
  }

  async function handleDragEnd(event: DragEndEvent, type: TransactionType) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const group = categories.filter((c) => c.type === type)
    const oldIndex = group.findIndex((c) => c.id === active.id)
    const newIndex = group.findIndex((c) => c.id === over.id)
    const reordered = arrayMove(group, oldIndex, newIndex)

    setCategories((prev) => [
      ...prev.filter((c) => c.type !== type),
      ...reordered,
    ])

    await Promise.all(
      reordered.map((cat, idx) =>
        supabase.from('categories').update({ sort_order: idx + 1 }).eq('id', cat.id),
      ),
    )
  }

  const grouped = TYPES.reduce<Record<TransactionType, Category[]>>(
    (acc, type) => { acc[type] = categories.filter((c) => c.type === type); return acc },
    { expense: [], income: [], savings: [] },
  )

  return (
    <div className="px-9 py-8">
      <h1 className="text-[26px] font-semibold text-ink tracking-[-0.02em]">Settings</h1>
      <SettingsNav />

      {fetchError && (
        <div className="mb-4 rounded-[10px] border border-border bg-red-soft px-4 py-3 text-sm text-red">
          {fetchError}
        </div>
      )}

      <div className="space-y-4">
        {TYPES.map((type) => (
          <div
            key={type}
            className="rounded-[18px] border border-border bg-surface shadow-card overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="text-sm font-semibold text-ink">
                {TYPE_LABELS[type]}
              </h2>
              <button
                onClick={() => (addingType === type ? cancelAdd() : startAdd(type))}
                className="text-xs font-medium text-terra hover:opacity-70 transition-opacity"
              >
                {addingType === type ? 'Cancel' : '+ Add'}
              </button>
            </div>

            {addingType === type && (
              <div className="px-5 py-3 border-b border-border bg-surface-alt">
                <div className="flex items-center gap-2">
                  <input
                    ref={addInputRef}
                    type="text"
                    placeholder="Category name"
                    value={addValue}
                    onChange={(e) => { setAddValue(e.target.value); setAddError(null) }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAdd()
                      if (e.key === 'Escape') cancelAdd()
                    }}
                    className="flex-1 text-sm border border-border rounded-[8px] px-3 py-1.5 bg-surface text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-terra focus:border-transparent"
                  />
                  <button
                    onClick={handleAdd}
                    disabled={!addValue.trim()}
                    className="px-3 py-1.5 text-xs font-medium bg-terra text-white rounded-[10px] shadow-terra hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
                  >
                    Add
                  </button>
                </div>
                {addError && (
                  <p className="mt-1.5 text-xs text-red">{addError}</p>
                )}
              </div>
            )}

            {loading ? (
              <div className="px-5 py-8 text-center text-sm text-ink-faint">
                Loading…
              </div>
            ) : grouped[type].length === 0 ? (
              <div className="px-5 py-6 text-center text-sm text-ink-faint">
                No categories yet.
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={(e) => handleDragEnd(e, type)}
              >
                <SortableContext
                  items={grouped[type].map((c) => c.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <ul className="divide-y divide-border">
                    {grouped[type].map((cat) => (
                      <SortableRow
                        key={cat.id}
                        cat={cat}
                        isEditing={editingId === cat.id}
                        isDeleting={deletingId === cat.id}
                        editValue={editValue}
                        editError={editError}
                        editInputRef={editInputRef}
                        onEditChange={(val) => { setEditValue(val); setEditError(null) }}
                        onSaveRename={() => handleRename(cat.id)}
                        onCancelEdit={cancelEdit}
                        onStartEdit={() => startEdit(cat)}
                        onStartDelete={() => { setDeletingId(cat.id); setEditingId(null) }}
                        onCancelDelete={() => setDeletingId(null)}
                        onConfirmDelete={() => handleDelete(cat.id)}
                      />
                    ))}
                  </ul>
                </SortableContext>
              </DndContext>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
