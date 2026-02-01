import * as React from 'react'
import {
  ChevronRight,
  ChevronDown,
  Building2,
  MapPin,
  Layers,
  Box,
  Eye,
  EyeOff,
  MoreVertical,
  Plus,
  Trash2,
  Edit3,
} from 'lucide-react'
import { cn } from '../../utils/cn'
import { Button } from '../ui/Button'
import {
  HierarchyManager,
  HierarchyNode,
  HierarchyNodeType,
  HierarchyChangeEvent,
} from '../../bim/hierarchy'

// ============================================================================
// TYPES
// ============================================================================

interface HierarchyTreeProps {
  manager: HierarchyManager
  onNodeSelect?: (nodeId: string, nodeType: HierarchyNodeType) => void
  onNodeDoubleClick?: (nodeId: string, nodeType: HierarchyNodeType) => void
  onContextMenu?: (
    nodeId: string,
    nodeType: HierarchyNodeType,
    event: React.MouseEvent
  ) => void
  className?: string
  showIcons?: boolean
  showVisibilityToggle?: boolean
  allowDragDrop?: boolean
  renderCustomNode?: (node: HierarchyNode, props: TreeNodeProps) => React.ReactNode
}

interface TreeNodeProps {
  node: HierarchyNode
  level: number
  manager: HierarchyManager
  isSelected: boolean
  isExpanded: boolean
  onToggleExpand: () => void
  onSelect: (e: React.MouseEvent) => void
  onDoubleClick: () => void
  onContextMenu: (e: React.MouseEvent) => void
  onToggleVisibility: (e: React.MouseEvent) => void
  showIcons: boolean
  showVisibilityToggle: boolean
  draggable: boolean
  onDragStart: (e: React.DragEvent) => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
  onDragEnter: (e: React.DragEvent) => void
  onDragLeave: (e: React.DragEvent) => void
  isDropTarget: boolean
}

// ============================================================================
// ICON COMPONENT
// ============================================================================

const NodeIcon: React.FC<{ type: HierarchyNodeType; className?: string }> = ({
  type,
  className,
}) => {
  switch (type) {
    case 'site':
      return <MapPin className={cn('w-4 h-4', className)} />
    case 'building':
      return <Building2 className={cn('w-4 h-4', className)} />
    case 'level':
      return <Layers className={cn('w-4 h-4', className)} />
    case 'object':
      return <Box className={cn('w-4 h-4', className)} />
    default:
      return <Box className={cn('w-4 h-4', className)} />
  }
}

// ============================================================================
// TREE NODE COMPONENT
// ============================================================================

const TreeNode: React.FC<TreeNodeProps> = ({
  node,
  level,
  manager,
  isSelected,
  isExpanded,
  onToggleExpand,
  onSelect,
  onDoubleClick,
  onContextMenu,
  onToggleVisibility,
  showIcons,
  showVisibilityToggle,
  draggable,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnter,
  onDragLeave,
  isDropTarget,
}) => {
  const hasChildren = node.children.length > 0
  const isVisible = manager.isVisible(node.id)

  return (
    <div
      className={cn(
        'select-none',
        isDropTarget && 'bg-savage-accent/20'
      )}
    >
      {/* Node Row */}
      <div
        className={cn(
          'flex items-center gap-1 px-2 py-1.5 rounded-md cursor-pointer transition-colors',
          'hover:bg-savage-surface/50',
          isSelected && 'bg-savage-accent/20 hover:bg-savage-accent/30',
          isDropTarget && 'ring-2 ring-savage-accent ring-inset'
        )}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={onSelect}
        onDoubleClick={onDoubleClick}
        onContextMenu={onContextMenu}
        draggable={draggable}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
      >
        {/* Expand/Collapse Toggle */}
        <button
          className={cn(
            'w-4 h-4 flex items-center justify-center rounded-sm',
            'hover:bg-savage-surface transition-colors',
            !hasChildren && 'invisible'
          )}
          onClick={(e) => {
            e.stopPropagation()
            onToggleExpand()
          }}
        >
          {isExpanded ? (
            <ChevronDown className="w-3 h-3 text-savage-text-muted" />
          ) : (
            <ChevronRight className="w-3 h-3 text-savage-text-muted" />
          )}
        </button>

        {/* Icon */}
        {showIcons && (
          <NodeIcon
            type={node.type}
            className={cn(
              'text-savage-text-muted',
              isSelected && 'text-savage-accent'
            )}
          />
        )}

        {/* Node Name */}
        <span
          className={cn(
            'flex-1 text-sm truncate',
            isSelected ? 'text-savage-accent font-medium' : 'text-savage-text',
            !isVisible && 'text-savage-text-muted line-through opacity-60'
          )}
        >
          {node.name}
        </span>

        {/* Visibility Toggle */}
        {showVisibilityToggle && (
          <button
            className={cn(
              'w-6 h-6 flex items-center justify-center rounded-sm',
              'opacity-0 group-hover:opacity-100 hover:bg-savage-surface',
              'transition-opacity'
            )}
            onClick={onToggleVisibility}
          >
            {isVisible ? (
              <Eye className="w-3.5 h-3.5 text-savage-text" />
            ) : (
              <EyeOff className="w-3.5 h-3.5 text-savage-text-muted" />
            )}
          </button>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// CONTEXT MENU COMPONENT
// ============================================================================

interface ContextMenuProps {
  x: number
  y: number
  nodeId: string
  nodeType: HierarchyNodeType
  onClose: () => void
  onRename: () => void
  onDelete: () => void
  onAddChild: () => void
  onExpand: () => void
  onCollapse: () => void
  canAddChild: boolean
  isExpanded: boolean
  hasChildren: boolean
}

const ContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  nodeId,
  nodeType,
  onClose,
  onRename,
  onDelete,
  onAddChild,
  onExpand,
  onCollapse,
  canAddChild,
  isExpanded,
  hasChildren,
}) => {
  const menuRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  return (
    <div
      ref={menuRef}
      className="fixed z-50 min-w-[160px] bg-savage-base border border-savage-surface rounded-lg shadow-lg py-1"
      style={{ left: x, top: y }}
    >
      {/* Node Info */}
      <div className="px-3 py-2 border-b border-savage-surface">
        <span className="text-xs font-medium text-savage-text-muted uppercase">
          {nodeType}
        </span>
        <div className="text-sm text-savage-text truncate max-w-[200px]">
          {nodeId.slice(0, 8)}...
        </div>
      </div>

      {/* Menu Items */}
      <div className="py-1">
        <button
          className="w-full px-3 py-1.5 text-left text-sm text-savage-text hover:bg-savage-surface flex items-center gap-2"
          onClick={onRename}
        >
          <Edit3 className="w-4 h-4" />
          Rename
        </button>

        {hasChildren && (
          <button
            className="w-full px-3 py-1.5 text-left text-sm text-savage-text hover:bg-savage-surface flex items-center gap-2"
            onClick={isExpanded ? onCollapse : onExpand}
          >
            {isExpanded ? (
              <>
                <ChevronRight className="w-4 h-4" />
                Collapse
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                Expand
              </>
            )}
          </button>
        )}

        {canAddChild && (
          <button
            className="w-full px-3 py-1.5 text-left text-sm text-savage-text hover:bg-savage-surface flex items-center gap-2"
            onClick={onAddChild}
          >
            <Plus className="w-4 h-4" />
            Add Child
          </button>
        )}

        <div className="my-1 border-t border-savage-surface" />

        <button
          className="w-full px-3 py-1.5 text-left text-sm text-savage-danger hover:bg-savage-surface flex items-center gap-2"
          onClick={onDelete}
        >
          <Trash2 className="w-4 h-4" />
          Delete
        </button>
      </div>
    </div>
  )
}

// ============================================================================
// MAIN HIERARCHY TREE COMPONENT
// ============================================================================

export const HierarchyTree: React.FC<HierarchyTreeProps> = ({
  manager,
  onNodeSelect,
  onNodeDoubleClick,
  onContextMenu,
  className,
  showIcons = true,
  showVisibilityToggle = true,
  allowDragDrop = true,
  renderCustomNode,
}) => {
  const [selectedNodeId, setSelectedNodeId] = React.useState<string | null>(null)
  const [contextMenu, setContextMenu] = React.useState<{
    x: number
    y: number
    nodeId: string
  } | null>(null)
  const [dragState, setDragState] = React.useState<{
    draggedId: string | null
    dropTargetId: string | null
  }>({ draggedId: null, dropTargetId: null })
  const [updateCounter, setUpdateCounter] = React.useState(0)

  // Subscribe to hierarchy changes
  React.useEffect(() => {
    const unsubscribe = manager.onChange(() => {
      setUpdateCounter(prev => prev + 1)
    })
    return unsubscribe
  }, [manager])

  // Handle node selection
  const handleSelect = (nodeId: string, e: React.MouseEvent) => {
    const additive = e.ctrlKey || e.metaKey
    
    if (additive && manager.isSelected(nodeId)) {
      manager.deselectNode(nodeId)
    } else {
      manager.selectNode(nodeId, additive)
    }
    
    setSelectedNodeId(nodeId)
    
    const node = manager.getNode(nodeId)
    if (node && onNodeSelect) {
      onNodeSelect(nodeId, node.type)
    }
  }

  // Handle node double click
  const handleDoubleClick = (nodeId: string) => {
    manager.toggleExpansion(nodeId)
    
    const node = manager.getNode(nodeId)
    if (node && onNodeDoubleClick) {
      onNodeDoubleClick(nodeId, node.type)
    }
  }

  // Handle context menu
  const handleContextMenu = (nodeId: string, e: React.MouseEvent) => {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY, nodeId })
    
    const node = manager.getNode(nodeId)
    if (node && onContextMenu) {
      onContextMenu(nodeId, node.type, e)
    }
  }

  // Handle visibility toggle
  const handleToggleVisibility = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    manager.toggleVisibility(nodeId)
  }

  // Drag and drop handlers
  const handleDragStart = (nodeId: string, e: React.DragEvent) => {
    if (!allowDragDrop) return
    
    e.dataTransfer.setData('text/plain', nodeId)
    e.dataTransfer.effectAllowed = 'move'
    setDragState({ draggedId: nodeId, dropTargetId: null })
  }

  const handleDragOver = (targetId: string, e: React.DragEvent) => {
    if (!allowDragDrop) return
    
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    
    const draggedId = dragState.draggedId
    if (draggedId && manager.canDrop(draggedId, targetId)) {
      setDragState(prev => ({ ...prev, dropTargetId: targetId }))
    }
  }

  const handleDrop = (targetId: string, e: React.DragEvent) => {
    if (!allowDragDrop) return
    
    e.preventDefault()
    const draggedId = e.dataTransfer.getData('text/plain')
    
    if (draggedId && manager.canDrop(draggedId, targetId)) {
      manager.drop(draggedId, targetId)
    }
    
    setDragState({ draggedId: null, dropTargetId: null })
  }

  // Render tree recursively
  const renderTree = (nodeId: string, level: number): React.ReactNode => {
    const node = manager.getNode(nodeId)
    if (!node) return null

    const isSelected = manager.isSelected(nodeId)
    const isExpanded = manager.isExpanded(nodeId)
    const isDropTarget = dragState.dropTargetId === nodeId
    const hasChildren = node.children.length > 0

    const nodeProps: TreeNodeProps = {
      node,
      level,
      manager,
      isSelected,
      isExpanded,
      onToggleExpand: () => manager.toggleExpansion(nodeId),
      onSelect: (e) => handleSelect(nodeId, e),
      onDoubleClick: () => handleDoubleClick(nodeId),
      onContextMenu: (e) => handleContextMenu(nodeId, e),
      onToggleVisibility: (e) => handleToggleVisibility(nodeId, e),
      showIcons,
      showVisibilityToggle,
      draggable: allowDragDrop && node.type !== 'site',
      onDragStart: (e) => handleDragStart(nodeId, e),
      onDragOver: (e) => handleDragOver(nodeId, e),
      onDrop: (e) => handleDrop(nodeId, e),
      onDragEnter: (e) => handleDragOver(nodeId, e),
      onDragLeave: () => setDragState(prev => ({ ...prev, dropTargetId: null })),
      isDropTarget,
    }

    return (
      <React.Fragment key={nodeId}>
        {renderCustomNode ? (
          renderCustomNode(node, nodeProps)
        ) : (
          <TreeNode {...nodeProps} />
        )}
        
        {/* Render children if expanded */}
        {isExpanded &&
          hasChildren &&
          node.children.map(childId => renderTree(childId, level + 1))}
      </React.Fragment>
    )
  }

  // Get root nodes
  const rootNodes = manager.getRootNodes()

  // Context menu handlers
  const handleContextMenuAction = (action: string) => {
    if (!contextMenu) return

    const nodeId = contextMenu.nodeId
    const node = manager.getNode(nodeId)
    if (!node) return

    switch (action) {
      case 'rename': {
        const newName = prompt('Enter new name:', node.name)
        if (newName) manager.renameNode(nodeId, newName)
        break
      }
      case 'delete': {
        if (confirm(`Are you sure you want to delete ${node.name}?`)) {
          switch (node.type) {
            case 'site':
              manager.removeSite(nodeId)
              break
            case 'building':
              manager.removeBuilding(nodeId)
              break
            case 'level':
              manager.removeLevel(nodeId)
              break
            case 'object':
              manager.removeObject(nodeId)
              break
          }
        }
        break
      }
      case 'expand':
        manager.expandNode(nodeId)
        break
      case 'collapse':
        manager.collapseNode(nodeId)
        break
    }

    setContextMenu(null)
  }

  // Determine if child can be added
  const canAddChild = (nodeType: HierarchyNodeType): boolean => {
    return nodeType !== 'object'
  }

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Tree Container */}
      <div className="flex-1 overflow-auto">
        {rootNodes.length === 0 ? (
          <div className="flex items-center justify-center h-full text-savage-text-muted text-sm">
            No sites created
          </div>
        ) : (
          <div className="py-2">
            {rootNodes.map(node => renderTree(node.id, 0))}
          </div>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          nodeId={contextMenu.nodeId}
          nodeType={manager.getNode(contextMenu.nodeId)?.type || 'object'}
          onClose={() => setContextMenu(null)}
          onRename={() => handleContextMenuAction('rename')}
          onDelete={() => handleContextMenuAction('delete')}
          onAddChild={() => handleContextMenuAction('addChild')}
          onExpand={() => handleContextMenuAction('expand')}
          onCollapse={() => handleContextMenuAction('collapse')}
          canAddChild={canAddChild(manager.getNode(contextMenu.nodeId)?.type || 'object')}
          isExpanded={manager.isExpanded(contextMenu.nodeId)}
          hasChildren={(manager.getNode(contextMenu.nodeId)?.children.length || 0) > 0}
        />
      )}
    </div>
  )
}

export default HierarchyTree
