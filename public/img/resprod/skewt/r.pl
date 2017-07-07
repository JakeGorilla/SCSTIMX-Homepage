#!/usr/bin/perl

my %table;
my $thisdate;
for (glob('*.png')){
	my $new = $_;
	$new =~ s/^(\d{4})(\d{2})(\d{2})(\d{2})\.png/$1-$2-$3-${4}00.png/;
	print "$1$2$3";
	if($thisdate != "$1$2$3"){
		#判斷前一日是否有且僅有00及12
		print "$table{$thisdate}";
	}
	#print "$1-$2-$3-$4\n";
	
#	rename $_,$new;
}
