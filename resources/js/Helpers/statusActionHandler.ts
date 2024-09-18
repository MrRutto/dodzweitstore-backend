
export function statusActionHandler({action, status}: {action: string, status: string}): boolean {
  switch(action) {
    case 'rejected': 
    case 'processing': 
        if (status == 'placed') return true;
        break;
    case 'delivered': 
        if (['dispatched','processing', 'placed'].includes(status)) return true;
        break;
    case 'dispatched': 
        if (['placed','processing'].includes(status)) return true;
        break;
    default: return true;
  }

  return false;
}