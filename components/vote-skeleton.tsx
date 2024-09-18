import { supportedChains } from "@/utils/chains";
import { Skeleton } from "@mui/material";

export function VoteSkeleton() {
  return (
    <div className="mb-96">
      <div>
        <div>
          <div className="mb-4 text-3xl font-semibold">
            <Skeleton
              variant="rectangular"
              animation="wave"
              width={120}
              height={16}
            />
          </div>
          <div className="mb-8">
            <Skeleton
              variant="rectangular"
              animation="wave"
              width={160}
              height={16}
            />
          </div>

          <div className="mb-6">
            <div className="text-xl font-semibold mb-2">Proposal Info</div>
            <div className="flex lg:flex-row flex-col lg:items-center lg:space-y-0 space-y-4">
              <div>
                <div className="w-48">
                  <div className="mb-1">Status</div>
                  <div className="flex flex-row items-center">
                    <Skeleton
                      variant="circular"
                      animation="wave"
                      width={32}
                      height={32}
                    />
                  </div>
                </div>
              </div>
              <div className="w-60">
                <div className="mb-1">Start Date</div>
                <div>
                  <Skeleton
                    variant="rectangular"
                    animation="wave"
                    width={120}
                    height={16}
                  />
                </div>
              </div>
              <div className="w-60">
                <div className="mb-1">End Date</div>
                <div>
                  <Skeleton
                    variant="rectangular"
                    animation="wave"
                    width={120}
                    height={16}
                  />
                </div>
              </div>
              <div>
                <div>Chains</div>
                <div className="flex sm:flex-row flex-col sm:items-center">
                  <div className="md:mb-0 mb-1 mr-2">Voting available on</div>
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

          <div className="mb-6">
            <div className="text-xl font-semibold mb-2">Token Info</div>
            <div className="flex lg:flex-row flex-col lg:items-center lg:space-y-0 space-y-4">
              <div className="w-48">
                <div className="mb-1">Token Name</div>
                <Skeleton
                  variant="rectangular"
                  animation="wave"
                  width={120}
                  height={16}
                />
              </div>
              <div className="w-60">
                <div className="mb-1">Your Token Balance </div>
                <Skeleton
                  variant="rectangular"
                  animation="wave"
                  width={120}
                  height={16}
                />
              </div>
              <div className="w-60">
                <div className="mb-1">Your Delegated Amount</div>
                <Skeleton
                  variant="rectangular"
                  animation="wave"
                  width={120}
                  height={16}
                />
              </div>
              <div>
                <div className="mb-1">Your Voting Power</div>
                <Skeleton
                  variant="rectangular"
                  animation="wave"
                  width={120}
                  height={16}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
