import React from 'react';
import { useAuth } from '../context/AuthProvider';

/**
 * 带权限检查的按钮组件
 * @param {Object} props
 * @param {string[]} [props.requiredRoles] - 需要的角色
 * @param {string[]} [props.requiredPermissions] - 需要的权限
 * @param {Function} props.onClick - 点击事件处理
 * @param {React.ReactNode} props.children - 按钮内容
 * @param {boolean} [props.hide=false] - 是否在无权限时隐藏按钮
 * @param {Object} [props.buttonProps] - 其他按钮属性
 */
export const PermissionButton = ({ 
  requiredRoles = [], 
  requiredPermissions = [], 
  onClick, 
  children,
  hide = false,
  ...buttonProps 
}) => {
  const { checkPermission } = useAuth();
  const hasPermission = checkPermission(requiredRoles, requiredPermissions);

  if (!hasPermission && hide) {
    return null;
  }

  return (
    <button
      {...buttonProps}
      onClick={hasPermission ? onClick : undefined}
      disabled={!hasPermission || buttonProps.disabled}
      style={{
        ...buttonProps.style,
        cursor: hasPermission ? 'pointer' : 'not-allowed',
        opacity: hasPermission ? 1 : 0.5,
      }}
    >
      {children}
    </button>
  );
}; 