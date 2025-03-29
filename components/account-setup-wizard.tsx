"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Copy, ArrowRight, ArrowLeft, CloudCog } from "lucide-react"
import { toast } from "sonner"

// Define the types for our actions
type ActionOption = {
  id: string
  name: string
  parentId: string
}

type Action = {
  id: string
  name: string
  options: ActionOption[]
}

export default function AccountSetupWizard() {
  // State for the selected actions and options
  const [selectedActions, setSelectedActions] = useState<string[]>([])
  const [selectedOptions, setSelectedOptions] = useState<string[]>([])
  const [currentStep, setCurrentStep] = useState<string>("select-actions")

  // Define the actions and their respective options
  const actions: Action[] = [
    {
      id: "start-stop-resources",
      name: "Start/Stop Resources",
      options: [
        { id: "ec2", name: "EC2", parentId: "start-stop-resources" },
        { id: "rds", name: "RDS", parentId: "start-stop-resources" },
        {
          id: "light-sail",
          name: "Light Sail",
          parentId: "start-stop-resources",
        },
        {
          id: "amazon-neptune",
          name: "Amazon Neptune",
          parentId: "start-stop-resources",
        },
      ],
    },
    {
      id: "pause-resume-resource",
      name: "Pause/Resume Resource",
      options: [
        {
          id: "redshift-clusters",
          name: "Redshift Clusters",
          parentId: "pause-resume-resource",
        },
        {
          id: "aurora-serverless-v2",
          name: "Aurora Serverless v2",
          parentId: "pause-resume-resource",
        },
      ],
    },
    {
      id: "resource-cleanup",
      name: "Resource Cleanup",
      options: [
        {
          id: "terminate-ec2",
          name: "Terminate EC2",
          parentId: "resource-cleanup",
        },
        {
          id: "delete-ebs-volume",
          name: "Delete EBS Volume",
          parentId: "resource-cleanup",
        },
        {
          id: "delete-ebs-snapshot",
          name: "Delete EBS Snapshot",
          parentId: "resource-cleanup",
        },
        { id: "delete-rds", name: "Delete RDS", parentId: "resource-cleanup" },
        {
          id: "delete-rds-snapshot",
          name: "Delete RDS Snapshot",
          parentId: "resource-cleanup",
        },
      ],
    },
  ]

  // Sample IAM policy for demonstration
  const iamPolicy = `{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ec2:DescribeInstances",
        "ec2:StartInstances",
        "ec2:StopInstances",
        "rds:DescribeDBInstances",
        "rds:StartDBInstance",
        "rds:StopDBInstance"
      ],
      "Resource": "*"
    }
  ]
}`

  // Update parent action state based on child options
  useEffect(() => {
    const newSelectedActions = [...selectedActions]

    actions.forEach((action) => {
      const actionOptions = action.options.map((option) => option.id)
      const selectedActionOptions = actionOptions.filter((optionId) => selectedOptions.includes(optionId))

      // If all options of an action are selected, select the action
      if (selectedActionOptions.length === actionOptions.length && actionOptions.length > 0) {
        if (!newSelectedActions.includes(action.id)) {
          newSelectedActions.push(action.id)
        }
      }
      // If any option is not selected, deselect the action
      else {
        const index = newSelectedActions.indexOf(action.id)
        if (index !== -1) {
          newSelectedActions.splice(index, 1)
        }
      }
    })

    // Only update if there's a change to avoid infinite loop
    if (JSON.stringify(newSelectedActions) !== JSON.stringify(selectedActions)) {
      setSelectedActions(newSelectedActions)
    }
  }, [selectedOptions])

  // Handle parent action toggle
  const handleActionToggle = (actionId: string) => {
    const action = actions.find((a) => a.id === actionId)
    if (!action) return

    const actionOptions = action.options.map((option) => option.id)

    if (selectedActions.includes(actionId)) {
      // Deselect action and all its options
      setSelectedActions((prev) => prev.filter((id) => id !== actionId))
      setSelectedOptions((prev) => prev.filter((id) => !actionOptions.includes(id)))
    } else {
      // Select action and all its options
      setSelectedActions((prev) => [...prev, actionId])
      setSelectedOptions((prev) => {
        const newOptions = [...prev]
        actionOptions.forEach((optionId) => {
          if (!newOptions.includes(optionId)) {
            newOptions.push(optionId)
          }
        })
        return newOptions
      })
    }
  }

  // Handle option toggle
  const handleOptionToggle = (optionId: string, parentId: string) => {
    if (selectedOptions.includes(optionId)) {
      // Deselect option
      setSelectedOptions((prev) => prev.filter((id) => id !== optionId))

      // Also deselect the parent action
      setSelectedActions((prev) => prev.filter((id) => id !== parentId))
    } else {
      // Select option
      setSelectedOptions((prev) => [...prev, optionId])

      // Check if all siblings are now selected
      const parentAction = actions.find((a) => a.id === parentId)
      if (parentAction) {
        const siblingOptions = parentAction.options.map((option) => option.id)
        const willAllSiblingsBeSelected = siblingOptions.every(
          (siblingId) => siblingId === optionId || selectedOptions.includes(siblingId),
        )

        // If all siblings will be selected, also select the parent
        if (willAllSiblingsBeSelected && !selectedActions.includes(parentId)) {
          setSelectedActions((prev) => [...prev, parentId])
        }
      }
    }
  }

  // Check if action is in indeterminate state (some but not all options selected)
  const isActionIndeterminate = (actionId: string) => {
    const action = actions.find((a) => a.id === actionId)
    if (!action) return false

    const actionOptions = action.options.map((option) => option.id)
    const selectedActionOptions = actionOptions.filter((optionId) => selectedOptions.includes(optionId))

    return selectedActionOptions.length > 0 && selectedActionOptions.length < actionOptions.length
  }

  // Copy IAM policy to clipboard
  const copyIAMPolicy = () => {
    navigator.clipboard.writeText(iamPolicy)
    toast.success("IAM policy has been copied to your clipboard")
  }

  // Navigation handlers
  const handleNext = () => {
    if (currentStep === "start") {
      setCurrentStep("select-actions")
    } else if (currentStep === "select-actions") {
      setCurrentStep("link-aws-api")
    } else if (currentStep === "link-aws-api") {
      setCurrentStep("fetch")
    }
  }

  const handleBack = () => {
    if (currentStep === "select-actions") {
      setCurrentStep("start")
    } else if (currentStep === "link-aws-api") {
      setCurrentStep("select-actions")
    } else if (currentStep === "fetch") {
      setCurrentStep("link-aws-api")
    }
  }

  return (
    <div className="flex flex-col space-y-6 w-full">
      <header className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <CloudCog className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold">AWS Cost Optimizer</h1>
        </div>
      </header>

      <Card className="border-2 border-primary/10 shadow-lg w-full">
        <CardHeader className="border-b bg-muted/30">
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl">Add Account - Step 2</CardTitle>
            <Badge variant="outline" className="px-3 py-1">
              {selectedOptions.length} options selected
            </Badge>
          </div>
        </CardHeader>
        <div className="md:flex p-4 w-full">
          <CardContent className="p-0 md:w-[60%]">
            <Tabs defaultValue="select-actions" value={currentStep} className="w-full" onValueChange={setCurrentStep}>
              <TabsList className="w-full justify-start rounded-none border-b bg-background p-0">
                <TabsTrigger
                  value="start"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-b-black px-4 py-3"
                >
                  Start
                </TabsTrigger>
                <TabsTrigger
                  value="select-actions"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-b-black px-4 py-3"
                >
                  Select Actions
                </TabsTrigger>
                <TabsTrigger
                  value="link-aws-api"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-b-black px-4 py-3"
                >
                  Link AWS A/c
                </TabsTrigger>
                <TabsTrigger
                  value="fetch"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-b-black px-4 py-3"
                >
                  Fetch
                </TabsTrigger>
              </TabsList>

              <TabsContent value="start" className="p-6">
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold">Account Information</h2>
                  <p>This wizard will guide you through setting up cost optimization for your AWS account.</p>
                  <p>In the next steps, you'll choose cost-saving actions to enable and connect your AWS account.</p>
                </div>
              </TabsContent>

              <TabsContent value="select-actions" className="p-0">
                <div className="col-span-2 p-6 max-h-[600px] overflow-y-auto">
                  <h2 className="text-xl font-semibold mb-4">Cost Saving Actions</h2>

                  <div className="space-y-6">
                    {actions.map((action) => (
                      <div key={action.id} className="space-y-3">
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            id={action.id}
                            checked={selectedActions.includes(action.id)}
                            onCheckedChange={() => handleActionToggle(action.id)}
                            data-indeterminate={isActionIndeterminate(action.id)}
                            className={isActionIndeterminate(action.id) ? "opacity-70" : ""}
                          />
                          <Label htmlFor={action.id} className="font-medium text-lg cursor-pointer">
                            {action.name}
                          </Label>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-8">
                          {action.options.map((option) => (
                            <div
                              key={option.id}
                              className={`flex items-center space-x-3 p-2 rounded-lg ${
                                selectedOptions.includes(option.id) ? "bg-primary/5" : ""
                              }`}
                            >
                              <Checkbox
                                id={option.id}
                                checked={selectedOptions.includes(option.id)}
                                onCheckedChange={() => handleOptionToggle(option.id, option.parentId)}
                              />
                              <Label htmlFor={option.id} className="cursor-pointer">
                                {option.name}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="link-aws-api" className="p-6">
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold">Link AWS Account</h2>
                  <p>Connect your AWS account to enable the selected cost-saving actions.</p>
                  <p>This step will be implemented in the full application.</p>
                </div>
              </TabsContent>

              <TabsContent value="fetch" className="p-6">
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold">Fetch Resources</h2>
                  <p>Fetch and analyze your AWS resources to identify cost-saving opportunities.</p>
                  <p>This step will be implemented in the full application.</p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
          <div className="border-l p-6 md:w-[40%]">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">IAM Policy</h3>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={copyIAMPolicy}>
                        <Copy className="h-4 w-4" />
                        <span className="sr-only">Copy IAM policy</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Copy IAM policy</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="bg-muted p-3 rounded-md text-xs font-mono overflow-x-auto max-h-[400px] overflow-y-auto">
                <pre>{iamPolicy}</pre>
              </div>
            </div>
          </div>
        </div>
        <CardFooter className="flex justify-between border-t p-4 bg-muted/30">
          <Button variant="outline" onClick={handleBack} disabled={currentStep === "start"}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <Button
            onClick={handleNext}
            disabled={currentStep === "fetch" || (currentStep === "select-actions" && selectedOptions.length === 0)}
          >
            Next <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

