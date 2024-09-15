import { supportedChains } from "@/utils/chains";
import { PAGINATION_SIZE } from "@/utils/helpers";
import { Skeleton } from "@mui/material";

export function ProposalsSkeleton() {
  return (
    <ul>
      {Array.from({ length: PAGINATION_SIZE }).map((_, index) => {
        return (
          <li key={index}>
            <div className="flex flex-row justify-center">
              <div
                className="border rounded-lg border-gray-400 hover:border-white shadow-md hover:shadow-blue-500/50 transition-all flex md:flex-row md:justify-between flex-col p-4 mb-10"
                style={{ width: "100%", maxWidth: "1200px" }}
              >
                <div>
                  <div
                    className="text-xl font-semibold mb-2"
                    style={{ width: "100%", maxWidth: "800px" }}
                  >
                    <Skeleton
                      variant="rectangular"
                      animation="wave"
                      width={120}
                      height={16}
                    />
                  </div>
                  <div
                    className="mb-2"
                    style={{ width: "100%", maxWidth: "800px" }}
                  >
                    <Skeleton
                      variant="rectangular"
                      animation="wave"
                      width={160}
                      height={16}
                    />
                  </div>
                  <div className="mb-2 flex flex-row items-center">
                    <Skeleton
                      variant="rectangular"
                      animation="wave"
                      width={100}
                      height={16}
                    />
                    {/* <div className="mx-2">-</div> */}
                    <div className="mx-2" />
                    <Skeleton
                      variant="rectangular"
                      animation="wave"
                      width={100}
                      height={16}
                    />
                  </div>
                  <div className="mb-2">
                    <Skeleton
                      variant="rectangular"
                      animation="wave"
                      width={120}
                      height={16}
                    />
                  </div>
                  <div className="flex flex-row items-center">
                    <div className="mr-4">
                      <Skeleton
                        variant="circular"
                        animation="wave"
                        width={32}
                        height={32}
                      />
                    </div>

                    <Skeleton
                      variant="rectangular"
                      animation="wave"
                      width={120}
                      height={16}
                    />
                  </div>
                </div>
                <div className="flex flex-col justify-between">
                  <div>
                    <div className="flex flex-row items-center md:justify-end mb-4 md:mt-0 mt-4">
                      <div className="mr-2">Proposal Created on</div>
                      <Skeleton
                        variant="circular"
                        animation="wave"
                        width={32}
                        height={32}
                      />
                    </div>
                  </div>
                  <div className="flex sm:flex-row flex-col md:justify-end sm:items-center">
                    <div className="md:mb-0 mb-2 mr-2">Voting available on</div>
                    {Array.from({ length: supportedChains.length }).map(
                      (_, index) => (
                        <div key={index} className="mr-2">
                          <Skeleton
                            variant="circular"
                            animation="wave"
                            width={32}
                            height={32}
                          />
                        </div>
                      ),
                    )}
                  </div>
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
