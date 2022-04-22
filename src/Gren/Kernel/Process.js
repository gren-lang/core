/*

import Gren.Kernel.Scheduler exposing (binding, succeed)
import Basics exposing (Unit)

*/


function _Process_sleep(time)
{
	return __Scheduler_binding(function(callback) {
		var id = setTimeout(function() {
			callback(__Scheduler_succeed(__Basics_Unit));
		}, time);

		return function() { clearTimeout(id); };
	});
}
