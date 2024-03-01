import { memo, ReactNode, useCallback } from 'react'
import { Dropdown, MenuItem, MenuItemProps } from 'react-bootstrap'
import { Trans, useTranslation } from 'react-i18next'
import Tooltip from '../../../shared/components/tooltip'
import Icon from '../../../shared/components/icon'
import IconChecked from '../../../shared/components/icon-checked'
import ControlledDropdown from '../../../shared/components/controlled-dropdown'
import {
  IdeLayout,
  IdeView,
  useLayoutContext,
} from '../../../shared/context/layout-context'
import * as eventTracking from '../../../infrastructure/event-tracking'
import useEventListener from '../../../shared/hooks/use-event-listener'
import { DetachRole } from '@/shared/context/detach-context'

function IconPlaceholder() {
  return <Icon type="" fw />
}

function IconRefresh() {
  return <Icon type="refresh" fw spin />
}

function IconLayout() {
  return <Icon type="columns" fw />
}

function IconSplit() {
  return <Icon type="columns" fw />
}

function IconDetach() {
  return <Icon type="window-restore" fw />
}

function IconEditorOnly() {
  return <Icon type="code" fw />
}

function IconPdfOnly() {
  return <Icon type="file-pdf-o" fw />
}

function IconCheckmark({
  iconFor,
  pdfLayout,
  view,
  detachRole,
}: {
  iconFor: string
  pdfLayout: IdeLayout
  view: IdeView | null
  detachRole?: DetachRole
}) {
  if (detachRole === 'detacher' || view === 'history') {
    return <IconPlaceholder />
  }
  if (
    iconFor === 'editorOnly' &&
    pdfLayout === 'flat' &&
    (view === 'editor' || view === 'file')
  ) {
    return <IconChecked />
  } else if (iconFor === 'pdfOnly' && pdfLayout === 'flat' && view === 'pdf') {
    return <IconChecked />
  } else if (iconFor === 'sideBySide' && pdfLayout === 'sideBySide') {
    return <IconChecked />
  }
  // return empty icon for placeholder
  return <IconPlaceholder />
}

function LayoutMenuItem({
  checkmark,
  icon,
  text,
  ...props
}: {
  checkmark: ReactNode
  icon: ReactNode
  text: string | ReactNode
} & MenuItemProps) {
  return (
    <MenuItem {...props}>
      <div className="layout-menu-item">
        <div className="layout-menu-item-start">
          <div>{checkmark}</div>
          <div>{icon}</div>
          <div>{text}</div>
        </div>
      </div>
    </MenuItem>
  )
}

function DetachDisabled() {
  const { t } = useTranslation()

  return (
    <Tooltip
      id="detach-disabled"
      description={t('your_browser_does_not_support_this_feature')}
      overlayProps={{ placement: 'left' }}
    >
      <LayoutMenuItem
        disabled
        checkmark={<IconPlaceholder />}
        icon={<IconDetach />}
        text={t('pdf_in_separate_tab')}
      />
    </Tooltip>
  )
}

function LayoutDropdownButton() {
  const { t } = useTranslation()

  const {
    reattach,
    detach,
    detachIsLinked,
    detachRole,
    changeLayout,
    view,
    pdfLayout,
  } = useLayoutContext()

  const handleDetach = useCallback(() => {
    detach()
    eventTracking.sendMB('project-layout-detach')
  }, [detach])

  const handleReattach = useCallback(() => {
    if (detachRole !== 'detacher') {
      return
    }
    reattach()
    eventTracking.sendMB('project-layout-reattach')
  }, [detachRole, reattach])

  // reattach when the PDF pane opens
  useEventListener('ui:pdf-open', handleReattach)

  const handleChangeLayout = useCallback(
    (newLayout: IdeLayout, newView?: IdeView) => {
      handleReattach()
      changeLayout(newLayout, newView)
      eventTracking.sendMB('project-layout-change', {
        layout: newLayout,
        view: newView,
      })
    },
    [changeLayout, handleReattach]
  )

  const processing = !detachIsLinked && detachRole === 'detacher'

  // bsStyle is required for Dropdown.Toggle, but we will override style
  return (
    <>
      {processing && (
        <div aria-live="assertive" className="sr-only">
          {t('layout_processing')}
        </div>
      )}
      <ControlledDropdown
        id="layout-dropdown"
        onMainButtonClick={() => {
          eventTracking.sendMB('navigation-clicked-layout')
        }}
        className="toolbar-item layout-dropdown"
        pullRight
      >
        <Dropdown.Toggle className="btn-full-height" bsStyle="link">
          {processing ? <IconRefresh /> : <IconLayout />}
          <span className="toolbar-label">{t('layout')}</span>
        </Dropdown.Toggle>
        <Dropdown.Menu className="layout-dropdown-list">
          <LayoutMenuItem
            onSelect={() => handleChangeLayout('sideBySide')}
            checkmark={
              <IconCheckmark
                iconFor="sideBySide"
                pdfLayout={pdfLayout}
                view={view}
                detachRole={detachRole}
              />
            }
            icon={<IconSplit />}
            text={t('editor_and_pdf')}
          />

          <LayoutMenuItem
            onSelect={() => handleChangeLayout('flat', 'editor')}
            checkmark={
              <IconCheckmark
                iconFor="editorOnly"
                pdfLayout={pdfLayout}
                view={view}
                detachRole={detachRole}
              />
            }
            icon={<IconEditorOnly />}
            text={
              <Trans
                i18nKey="editor_only_hide_pdf"
                components={[
                  <span key="editor_only_hide_pdf" className="subdued" />,
                ]}
              />
            }
          />

          <LayoutMenuItem
            onSelect={() => handleChangeLayout('flat', 'pdf')}
            checkmark={
              <IconCheckmark
                iconFor="pdfOnly"
                pdfLayout={pdfLayout}
                view={view}
                detachRole={detachRole}
              />
            }
            icon={<IconPdfOnly />}
            text={
              <Trans
                i18nKey="pdf_only_hide_editor"
                components={[
                  <span key="pdf_only_hide_editor" className="subdued" />,
                ]}
              />
            }
          />

          {'BroadcastChannel' in window ? (
            <LayoutMenuItem
              onSelect={() => handleDetach()}
              checkmark={
                detachRole === 'detacher' ? (
                  detachIsLinked ? (
                    <IconChecked />
                  ) : (
                    <IconRefresh />
                  )
                ) : (
                  <IconPlaceholder />
                )
              }
              icon={<IconDetach />}
              text={t('pdf_in_separate_tab')}
            />
          ) : (
            <DetachDisabled />
          )}
        </Dropdown.Menu>
      </ControlledDropdown>
    </>
  )
}

export default memo(LayoutDropdownButton)
