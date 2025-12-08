"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { useMediaQuery } from "../hooks/use-media-query"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"

interface BaseProps {
  children: React.ReactNode
}

interface RootCredenzaProps extends BaseProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

interface CredenzaProps extends BaseProps {
  className?: string
  asChild?: true
}

const desktop = "(min-width: 768px)"

// Root wrapper: uses Dialog on desktop and Drawer on mobile
const Credenza = ({ children, open, onOpenChange, ...props }: RootCredenzaProps) => {
  const isDesktop = useMediaQuery(desktop)
  const Component = isDesktop ? Dialog : Drawer

  // When opening the mobile Drawer, blur the previously focused element
  // so it won't remain focused inside an aria-hidden region. This prevents
  // the "aria-hidden on a focused element" accessibility warning.
  React.useEffect(() => {
    if (!isDesktop && open) {
      try {
        const active = document.activeElement as HTMLElement | null
        if (active && (active.tagName === "BUTTON" || active.tabIndex >= 0)) {
          active.blur()
        }
      } catch (e) {
        // ignore
      }
    }
  }, [isDesktop, open])

  // For mobile Drawer, prevent closing when swiping down (only close via close button)
  // This prevents the drawer from closing when scrolling inside
  const drawerProps = !isDesktop ? { 
    dismissible: false
  } : {}

  return (
    <Component open={open} onOpenChange={onOpenChange} {...(props as any)} {...drawerProps}>
      {children}
    </Component>
  )
}

const CredenzaTrigger = ({ className, children, ...props }: CredenzaProps) => {
  const isDesktop = useMediaQuery(desktop)
  const Trigger = isDesktop ? DialogTrigger : DrawerTrigger

  return (
    <Trigger className={className} {...props}>
      {children}
    </Trigger>
  )
}

const CredenzaClose = ({ className, children, ...props }: CredenzaProps) => {
  const isDesktop = useMediaQuery(desktop)
  const Close = isDesktop ? DialogClose : DrawerClose

  return (
    <Close className={className} {...props}>
      {children}
    </Close>
  )
}

const CredenzaContent = ({ className, children, ...props }: CredenzaProps) => {
  const isDesktop = useMediaQuery(desktop)
  const Content = isDesktop ? DialogContent : DrawerContent

  return (
    <Content className={className} {...props}>
      {children}
    </Content>
  )
}

const CredenzaDescription = ({
  className,
  children,
  ...props
}: CredenzaProps) => {
  const isDesktop = useMediaQuery(desktop)
  const Description = isDesktop ? DialogDescription : DrawerDescription

  return (
    <Description className={className} {...props}>
      {children}
    </Description>
  )
}

const CredenzaHeader = ({ className, children, ...props }: CredenzaProps) => {
  const isDesktop = useMediaQuery(desktop)
  const Header = isDesktop ? DialogHeader : DrawerHeader

  return (
    <Header className={className} {...props}>
      {children}
    </Header>
  )
}

const CredenzaTitle = ({ className, children, ...props }: CredenzaProps) => {
  const isDesktop = useMediaQuery(desktop)
  const Title = isDesktop ? DialogTitle : DrawerTitle

  return (
    <Title className={className} {...props}>
      {children}
    </Title>
  )
}

const CredenzaBody = ({ className, children, ...props }: CredenzaProps) => {
  const isDesktop = useMediaQuery(desktop)
  return (
    <div className={cn(
      isDesktop ? "px-0" : "px-4 pb-2",
      className
    )} {...props}>
      {children}
    </div>
  )
}

const CredenzaFooter = ({ className, children, ...props }: CredenzaProps) => {
  const isDesktop = useMediaQuery(desktop)
  const Footer = isDesktop ? DialogFooter : DrawerFooter

  return (
    <Footer className={className} {...props}>
      {children}
    </Footer>
  )
}

export {
  Credenza,
  CredenzaTrigger,
  CredenzaClose,
  CredenzaContent,
  CredenzaDescription,
  CredenzaHeader,
  CredenzaTitle,
  CredenzaBody,
  CredenzaFooter,
}