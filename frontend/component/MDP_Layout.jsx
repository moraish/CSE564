import MDP from "./MDP";
import PCP from "./PCP";

export default function MDP_Layout() {
    return (
        <>
            <div>
                <MDP />
            </div>
            <div className="mb-15">
                <PCP />
            </div>
        </>
    )
}