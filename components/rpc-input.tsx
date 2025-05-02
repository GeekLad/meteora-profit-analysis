import { Input } from "@heroui/input";

import { useAppStateContext } from "@/app/providers";

export const RpcInput = () => {
  const { rpc, connection, updateRpc } = useAppStateContext();

  return (
    <Input
      className="md:m-4 p-4 hidden"
      isInvalid={connection == undefined}
      label="RPC"
      value={rpc}
      onChange={(event) => updateRpc(event.target.value)}
    />
  );
};
