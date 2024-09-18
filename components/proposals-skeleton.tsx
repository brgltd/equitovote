import { Skeleton } from "@mui/material";
import { supportedChains } from "@/utils/chains";
import { PAGINATION_SIZE } from "@/utils/helpers";

export function ProposalsSkeleton() {
  return (
    <ul>
      {Array.from({ length: PAGINATION_SIZE }).map((_, index) => {
        return (
          <li key={index}>
            <div className="flex flex-row justify-center">
              <div
                className="proposal-link-item"
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
                    <div className="proposal-link-item__chain">
                      <div className="mr-2">Proposal Created on</div>
                      <Skeleton
                        variant="circular"
                        animation="wave"
                        width={32}
                        height={32}
                      />
                    </div>
                  </div>
                  <div className="flex md:flex-row flex-col">
                    <div className="md:mb-0 mb-2 mr-2">Voting available on</div>
                    <div className="flex flex-row">
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
            </div>
          </li>
        );
      })}
    </ul>
  );
}
