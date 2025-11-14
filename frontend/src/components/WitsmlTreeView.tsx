import { useState } from 'react'
import { ChevronRight, ChevronDown, FileText, Folder, FolderOpen } from 'lucide-react'
import './WitsmlTreeView.css'

interface TreeNodeProps {
  label: string
  data: any
  onSelect: (data: any) => void
  level?: number
}

function TreeNode({ label, data, onSelect, level = 0 }: TreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(level < 2)
  const isObject = typeof data === 'object' && data !== null && !Array.isArray(data)
  const isArray = Array.isArray(data)
  const hasChildren = isObject || isArray

  const handleToggle = () => {
    if (hasChildren) {
      setIsExpanded(!isExpanded)
    }
  }

  const handleSelect = (e: React.MouseEvent) => {
    e.stopPropagation()
    onSelect({ label, data })
  }

  const renderValue = () => {
    if (data === null) return 'null'
    if (data === undefined) return 'undefined'
    if (typeof data === 'boolean') return data.toString()
    if (typeof data === 'number') return data.toString()
    if (typeof data === 'string') return data
    return ''
  }

  return (
    <div className="tree-node">
      <div
        className="tree-node-header"
        onClick={handleToggle}
        style={{ paddingLeft: `${level * 1.5}rem` }}
      >
        <span className="tree-node-icon">
          {hasChildren ? (
            isExpanded ? (
              <>
                <ChevronDown size={16} />
                <FolderOpen size={16} className="folder-icon" />
              </>
            ) : (
              <>
                <ChevronRight size={16} />
                <Folder size={16} className="folder-icon" />
              </>
            )
          ) : (
            <FileText size={16} className="file-icon" />
          )}
        </span>
        <span className="tree-node-label" onClick={handleSelect}>
          {label}
          {isArray && <span className="array-badge">[{data.length}]</span>}
        </span>
        {!hasChildren && (
          <span className="tree-node-value">{renderValue()}</span>
        )}
      </div>

      {hasChildren && isExpanded && (
        <div className="tree-node-children">
          {isArray
            ? data.map((item: any, index: number) => (
                <TreeNode
                  key={index}
                  label={`[${index}]`}
                  data={item}
                  onSelect={onSelect}
                  level={level + 1}
                />
              ))
            : Object.entries(data).map(([key, value]) => (
                <TreeNode
                  key={key}
                  label={key}
                  data={value}
                  onSelect={onSelect}
                  level={level + 1}
                />
              ))}
        </div>
      )}
    </div>
  )
}

interface WitsmlTreeViewProps {
  data: any
  onSelectObject: (obj: any) => void
}

function WitsmlTreeView({ data, onSelectObject }: WitsmlTreeViewProps) {
  return (
    <div className="witsml-tree-view">
      <h3>WITSML Data Structure</h3>
      <div className="tree-container">
        <TreeNode label="Root" data={data} onSelect={onSelectObject} />
      </div>
    </div>
  )
}

export default WitsmlTreeView
