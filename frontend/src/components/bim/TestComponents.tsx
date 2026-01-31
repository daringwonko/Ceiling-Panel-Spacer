import React, { useState } from "react"
import {
  Pencil,
  Square,
  Circle,
  Move,
  RotateCw,
  Maximize,
  Eye,
  Lock,
  Folder,
  FileText,
  Type,
  Download,
  Trash2,
  Settings,
} from "lucide-react"
import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  TooltipProvider,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Toolbar,
  Separator,
} from "../ui"
import { ToolButton } from "./ToolButton"
import { PropertyInput } from "./PropertyInput"
import { LayerListItem } from "./LayerListItem"
import { ObjectTreeItem, type BIMObject } from "./ObjectTreeItem"

export default function TestComponents() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [inputValue, setInputValue] = useState("")
  const [selectValue, setSelectValue] = useState("option1")
  const [activeTool, setActiveTool] = useState<string | null>("pencil")
  const [layers, setLayers] = useState([
    { id: "1", name: "Walls", visible: true, color: "#3b82f6", locked: false },
    { id: "2", name: "Dimensions", visible: true, color: "#10b981", locked: true },
    { id: "3", name: "Annotations", visible: false, color: "#f59e0b", locked: false },
  ])

  const [objects, setObjects] = useState<BIMObject[]>([
    {
      id: "1",
      name: "Project",
      type: "folder",
      expanded: true,
      visible: true,
      children: [
        {
          id: "2",
          name: "Ground Floor",
          type: "folder",
          expanded: true,
          visible: true,
          children: [
            { id: "3", name: "Wall-001", type: "object", visible: true },
            { id: "4", name: "Wall-002", type: "object", visible: true },
            { id: "5", name: "Door-001", type: "object", visible: false },
          ],
        },
        {
          id: "6",
          name: "First Floor",
          type: "folder",
          expanded: false,
          visible: true,
          children: [
            { id: "7", name: "Slab-001", type: "object", visible: true },
          ],
        },
      ],
    },
  ])

  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const toggleLayerVisibility = (id: string) => {
    setLayers(layers.map(l => l.id === id ? { ...l, visible: !l.visible } : l))
  }

  const toggleLayerLock = (id: string) => {
    setLayers(layers.map(l => l.id === id ? { ...l, locked: !l.locked } : l))
  }

  const toggleObjectExpand = (id: string) => {
    const toggleInTree = (objs: BIMObject[]): BIMObject[] => {
      return objs.map(obj => {
        if (obj.id === id) {
          return { ...obj, expanded: !obj.expanded }
        }
        if (obj.children) {
          return { ...obj, children: toggleInTree(obj.children) }
        }
        return obj
      })
    }
    setObjects(toggleInTree(objects))
  }

  const toggleObjectVisibility = (id: string) => {
    const toggleInTree = (objs: BIMObject[]): BIMObject[] => {
      return objs.map(obj => {
        if (obj.id === id) {
          return { ...obj, visible: obj.visible !== false ? false : true }
        }
        if (obj.children) {
          return { ...obj, children: toggleInTree(obj.children) }
        }
        return obj
      })
    }
    setObjects(toggleInTree(objects))
  }

  const toggleObjectSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const colorBoxes = [
    { name: "savage-primary", class: "bg-savage-primary" },
    { name: "savage-accent", class: "bg-savage-accent" },
    { name: "savage-dark", class: "bg-savage-dark" },
    { name: "savage-surface", class: "bg-savage-surface" },
    { name: "savage-text", class: "bg-savage-text" },
    { name: "savage-text-muted", class: "bg-savage-text-muted" },
    { name: "savage-success", class: "bg-savage-success" },
    { name: "savage-danger", class: "bg-savage-danger" },
  ]

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-savage-dark text-savage-text p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-12">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-savage-primary">
              Savage Cabinetry BIM Components
            </h1>
            <p className="text-savage-text-muted">
              Visual test page for all UI and BIM components
            </p>
          </div>

          {/* Section: Colors */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Brand Colors</h2>
            <div className="grid grid-cols-4 gap-4">
              {colorBoxes.map((color) => (
                <div key={color.name} className="space-y-2">
                  <div
                    className={`h-24 rounded-lg ${color.class} border border-savage-surface`}
                  />
                  <p className="text-sm text-savage-text-muted text-center">
                    {color.name}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <Separator />

          {/* Section: Buttons */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Buttons</h2>
            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Variants</h3>
                <div className="flex flex-wrap gap-2">
                  <Button>Default</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="danger">Danger</Button>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium">Sizes</h3>
                <div className="flex flex-wrap items-center gap-2">
                  <Button size="sm">Small</Button>
                  <Button size="md">Medium</Button>
                  <Button size="lg">Large</Button>
                  <Button size="icon">
                    <Settings className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </section>

          <Separator />

          {/* Section: Inputs */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Inputs</h2>
            <div className="grid grid-cols-2 gap-6 max-w-2xl">
              <Input
                label="Text Input"
                placeholder="Enter text..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
              />
              <Input
                label="With Error"
                placeholder="Invalid input"
                value=""
                error="This field is required"
              />
              <Input
                label="Number Input"
                type="number"
                placeholder="0"
              />
              <Input
                label="Disabled"
                placeholder="Cannot edit"
                disabled
              />
            </div>
          </section>

          <Separator />

          {/* Section: Select */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Select</h2>
            <div className="max-w-xs">
              <Select value={selectValue} onValueChange={setSelectValue}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="option1">Option 1</SelectItem>
                  <SelectItem value="option2">Option 2</SelectItem>
                  <SelectItem value="option3">Option 3</SelectItem>
                  <SelectItem value="option4">Option 4</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </section>

          <Separator />

          {/* Section: Dialog */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Dialog</h2>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>Open Dialog</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Example Dialog</DialogTitle>
                  <DialogDescription>
                    This is a dialog using Radix UI primitives styled with
                    Savage Cabinetry theme colors.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <p className="text-sm text-savage-text-muted">
                    Dialog content goes here. You can add forms, information, or
                    any other content.
                  </p>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={() => setDialogOpen(false)}>
                    Save Changes
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </section>

          <Separator />

          {/* Section: Tabs */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Tabs</h2>
            <Tabs defaultValue="general" className="max-w-xl">
              <TabsList>
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="properties">Properties</TabsTrigger>
                <TabsTrigger value="materials">Materials</TabsTrigger>
              </TabsList>
              <TabsContent value="general" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>General Settings</CardTitle>
                    <CardDescription>
                      Configure general project settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Input label="Project Name" defaultValue="My Project" />
                    <Input label="Description" defaultValue="A sample project" />
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="properties" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Object Properties</CardTitle>
                    <CardDescription>
                      View and edit object properties
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-savage-text-muted">
                      Properties content would go here
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="materials" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Materials</CardTitle>
                    <CardDescription>Manage material library</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-savage-text-muted">
                      Materials content would go here
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </section>

          <Separator />

          {/* Section: Card */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Card</h2>
            <div className="grid grid-cols-2 gap-4 max-w-3xl">
              <Card>
                <CardHeader>
                  <CardTitle>Standard Card</CardTitle>
                  <CardDescription>With header and content</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-savage-text-muted">
                    This is the main content area of the card.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Card with Footer</CardTitle>
                  <CardDescription>Includes action buttons</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-savage-text-muted">
                    Content with a footer section below.
                  </p>
                </CardContent>
                <CardFooter className="justify-end gap-2">
                  <Button variant="outline" size="sm">
                    Cancel
                  </Button>
                  <Button size="sm">Save</Button>
                </CardFooter>
              </Card>
            </div>
          </section>

          <Separator />

          {/* Section: Toolbar */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Toolbar</h2>
            <Toolbar>
              <Button variant="ghost" size="icon">
                <Pencil className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon">
                <Square className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon">
                <Circle className="w-4 h-4" />
              </Button>
              <Separator orientation="vertical" className="h-6 mx-1" />
              <Button variant="ghost" size="icon">
                <Move className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon">
                <RotateCw className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon">
                <Maximize className="w-4 h-4" />
              </Button>
            </Toolbar>
          </section>

          <Separator />

          {/* Section: BIM Components */}
          <section className="space-y-6">
            <h2 className="text-2xl font-semibold">BIM Components</h2>

            {/* ToolButtons */}
            <div className="space-y-2">
              <h3 className="text-lg font-medium">ToolButtons</h3>
              <div className="flex flex-wrap gap-2">
                <ToolButton
                  icon={Pencil}
                  label="Draw"
                  active={activeTool === "pencil"}
                  onClick={() => setActiveTool("pencil")}
                  tooltip="Draw Tool"
                  shortcut="Ctrl+D"
                />
                <ToolButton
                  icon={Square}
                  label="Rectangle"
                  active={activeTool === "rectangle"}
                  onClick={() => setActiveTool("rectangle")}
                  tooltip="Rectangle Tool"
                  shortcut="Ctrl+R"
                />
                <ToolButton
                  icon={Circle}
                  label="Circle"
                  active={activeTool === "circle"}
                  onClick={() => setActiveTool("circle")}
                  tooltip="Circle Tool"
                  shortcut="Ctrl+C"
                />
                <ToolButton
                  icon={Move}
                  label="Move"
                  active={activeTool === "move"}
                  onClick={() => setActiveTool("move")}
                  tooltip="Move Tool"
                  shortcut="Ctrl+M"
                />
                <ToolButton
                  icon={Type}
                  label="Text"
                  active={activeTool === "text"}
                  onClick={() => setActiveTool("text")}
                  tooltip="Text Tool"
                />
              </div>
            </div>

            {/* PropertyInputs */}
            <div className="space-y-2">
              <h3 className="text-lg font-medium">PropertyInputs</h3>
              <div className="grid grid-cols-3 gap-4 max-w-2xl">
                <PropertyInput
                  label="Width"
                  value={2400}
                  type="number"
                  unit="mm"
                  onChange={() => {}}
                />
                <PropertyInput
                  label="Height"
                  value={1200}
                  type="number"
                  unit="mm"
                  onChange={() => {}}
                />
                <PropertyInput
                  label="Material"
                  value="Oak"
                  type="select"
                  options={["Oak", "Pine", "Walnut", "Birch"]}
                  onChange={() => {}}
                />
              </div>
            </div>

            {/* LayerListItems */}
            <div className="space-y-2">
              <h3 className="text-lg font-medium">LayerListItems</h3>
              <Card className="max-w-sm">
                <CardHeader className="py-3">
                  <CardTitle className="text-sm">Layers</CardTitle>
                </CardHeader>
                <CardContent className="py-2">
                  <div className="space-y-1">
                    {layers.map((layer) => (
                      <LayerListItem
                        key={layer.id}
                        name={layer.name}
                        visible={layer.visible}
                        color={layer.color}
                        locked={layer.locked}
                        onToggleVisibility={() => toggleLayerVisibility(layer.id)}
                        onToggleLock={() => toggleLayerLock(layer.id)}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* ObjectTreeItems */}
            <div className="space-y-2">
              <h3 className="text-lg font-medium">ObjectTreeItems</h3>
              <Card className="max-w-sm">
                <CardHeader className="py-3">
                  <CardTitle className="text-sm">Object Tree</CardTitle>
                </CardHeader>
                <CardContent className="py-2">
                  <div className="space-y-1">
                    {objects.map((obj) => (
                      <ObjectTreeItem
                        key={obj.id}
                        object={obj}
                        onToggle={toggleObjectExpand}
                        onSelect={toggleObjectSelect}
                        onToggleVisibility={toggleObjectVisibility}
                        selectedIds={selectedIds}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>
        </div>
      </div>
    </TooltipProvider>
  )
}
