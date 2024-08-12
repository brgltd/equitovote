import { useQuery } from "@tanstack/react-query";
import { getEquitoClient } from "../utils/equito-client";

type UseRouterArgs = {
  chainSelector?: number;
};

export const useRouter = ({ chainSelector }: UseRouterArgs) =>
  useQuery({
    queryKey: ["routerContract", chainSelector],
	queryFn: async () => {
		return await (await getEquitoClient()).getRouter(chainSelector || 0);
	},
    enabled: !!chainSelector,
  });
