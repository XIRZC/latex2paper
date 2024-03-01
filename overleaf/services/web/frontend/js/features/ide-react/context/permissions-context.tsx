import { createContext, useContext, useEffect } from 'react'
import { useConnectionContext } from '@/features/ide-react/context/connection-context'
import { useEditorContext } from '@/shared/context/editor-context'
import getMeta from '@/utils/meta'
import {
  Permissions,
  PermissionsLevel,
} from '@/features/ide-react/types/permissions'
import useScopeValue from '@/shared/hooks/use-scope-value'
import { DeepReadonly } from '../../../../../types/utils'

const PermissionsContext = createContext<Permissions | undefined>(undefined)

const permissionsMap: DeepReadonly<Record<PermissionsLevel, Permissions>> = {
  readOnly: {
    read: true,
    write: false,
    admin: false,
    comment: true,
  },
  readAndWrite: {
    read: true,
    write: true,
    admin: false,
    comment: true,
  },
  owner: {
    read: true,
    write: true,
    admin: true,
    comment: true,
  },
}

const anonymousPermissionsMap: typeof permissionsMap = {
  readOnly: { ...permissionsMap.readOnly, comment: false },
  readAndWrite: { ...permissionsMap.readAndWrite, comment: false },
  owner: { ...permissionsMap.owner, comment: false },
}

export const PermissionsProvider: React.FC = ({ children }) => {
  const [permissions, setPermissions] =
    useScopeValue<Readonly<Permissions>>('permissions')
  const { connectionState } = useConnectionContext()
  const { permissionsLevel } = useEditorContext() as {
    permissionsLevel: PermissionsLevel
  }
  const anonymous = getMeta('ol-anonymous') as boolean | undefined

  useEffect(() => {
    const activePermissionsMap = anonymous
      ? anonymousPermissionsMap
      : permissionsMap
    setPermissions(activePermissionsMap[permissionsLevel])
  }, [anonymous, permissionsLevel, setPermissions])

  useEffect(() => {
    if (connectionState.forceDisconnected) {
      setPermissions(prevState => ({ ...prevState, write: false }))
    }
  }, [connectionState.forceDisconnected, setPermissions])

  return (
    <PermissionsContext.Provider value={permissions}>
      {children}
    </PermissionsContext.Provider>
  )
}

export function usePermissionsContext() {
  const context = useContext(PermissionsContext)

  if (!context) {
    throw new Error(
      'usePermissionsContext is only available inside PermissionsProvider'
    )
  }

  return context
}
