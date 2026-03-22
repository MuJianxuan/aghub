import { Component, type ReactNode } from "react"
import { Button } from "@heroui/react"
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription } from "./empty"

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return this.props.fallback ?? (
        <div className="flex items-center justify-center h-full p-6">
          <Empty>
            <EmptyHeader>
              <EmptyTitle>Something went wrong</EmptyTitle>
              <EmptyDescription>{this.state.error.message}</EmptyDescription>
            </EmptyHeader>
            <Button
              variant="outline"
              size="sm"
              onPress={() => this.setState({ error: null })}
            >
              Try again
            </Button>
          </Empty>
        </div>
      )
    }
    return this.props.children
  }
}
