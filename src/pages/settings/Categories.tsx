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
        isDragging ? 'opacity-50 bg-gray-50 dark:bg-gray-800/60' : ''
      }`}
    >
      <button
        {...(draggable ? { ...attributes, ...listeners } : {})}
        tabIndex={draggable ? 0 : -1}
        aria-label="Drag to reorder"
        className={`flex-shrink-0 transition-colors ${
          draggable
            ? 'cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 dark:text-gray-600 dark:hover:text-gray-400'
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
              className="flex-1 text-sm border border-gray-200 dark:border-gray-700 rounded-md px-3 py-1 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <button
              onClick={onSaveRename}
              disabled={!editValue.trim()}
              className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Save
            </button>
            <button
              onClick={onCancelEdit}
              className="text-xs font-medium text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              Cancel
            </button>
          </div>
          {editError && (
            <p className="text-xs text-red-600 dark:text-red-400">{editError}</p>
          )}
        </div>
      ) : isDeleting ? (
        <>
          <span className="flex-1 text-sm text-gray-500 dark:text-gray-400">
            Delete{' '}
            <span className="font-medium text-gray-900 dark:text-white">{cat.name}</span>?
          </span>
          <button
            onClick={onConfirmDelete}
            className="text-xs font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
          >
            Delete
          </button>
          <button
            onClick={onCancelDelete}
            className="text-xs font-medium text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            Cancel
          </button>
        </>
      ) : (
        <>
          <span className="flex-1 text-sm text-gray-900 dark:text-white">{cat.name}</span>
          <button
            onClick={onStartEdit}
            aria-label="Rename"
            className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            <PencilIcon />
          </button>
          <button
            onClick={onStartDelete}
            aria-label="Delete"
            className="p-1 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
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

    // Optimistic update
    setCategories((prev) => [
      ...prev.filter((c) => c.type !== type),
      ...reordered,
    ])

    // Persist — update only sort_order, one row at a time to avoid unique constraint conflicts
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
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Settings</h1>
      <SettingsNav />

      {fetchError && (
        <div className="mt-4 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          {fetchError}
        </div>
      )}

      <div className="mt-8 space-y-4">
        {TYPES.map((type) => (
          <div
            key={type}
            className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                {TYPE_LABELS[type]}
              </h2>
              <button
                onClick={() => (addingType === type ? cancelAdd() : startAdd(type))}
                className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
              >
                {addingType === type ? 'Cancel' : '+ Add'}
              </button>
            </div>

            {addingType === type && (
              <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40">
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
                    className="flex-1 text-sm border border-gray-200 dark:border-gray-700 rounded-md px-3 py-1.5 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  <button
                    onClick={handleAdd}
                    disabled={!addValue.trim()}
                    className="px-3 py-1.5 text-xs font-medium bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Add
                  </button>
                </div>
                {addError && (
                  <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{addError}</p>
                )}
              </div>
            )}

            {loading ? (
              <div className="px-5 py-8 text-center text-sm text-gray-400 dark:text-gray-600">
                Loading…
              </div>
            ) : grouped[type].length === 0 ? (
              <div className="px-5 py-6 text-center text-sm text-gray-400 dark:text-gray-600">
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
                  <ul className="divide-y divide-gray-100 dark:divide-gray-800">
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
